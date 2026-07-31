"""Image similarity & vectorization utilities."""

from __future__ import annotations

import concurrent.futures
import os
import time
from pathlib import Path

import numpy as np
import requests  # type: ignore[import]
from azure.core.exceptions import ResourceNotFoundError

from modules.utils.blob_utils import download_file_from_blob, upload_file_to_blob
from modules.utils.managed_identity import get_managed_identity_token


def vectorize_image_from_binary_data(
    image_path: str, max_retries: int = 10
) -> list[float]:
    """
    Azure Computer Visionのベクトル化APIを使用して画像をベクトル化する関数
    429 (Too Many Requests) エラーに対して指数バックオフでリトライする

    Args:
        image_path (str): ベクトル化する画像ファイルのパス
        max_retries (int): 最大リトライ回数

    Returns:
        list[float]: 画像のベクトル表現。

    Raises:
        requests.exceptions.RequestException: APIリクエストが失敗した場合
        ValueError: 環境変数が設定されていない場合
    """
    endpoint = os.environ.get("AZURE_COMPUTER_VISION_ENDPOINT")
    subscription_key = os.environ.get("AZURE_COMPUTER_VISION_SUBSCRIPTION_KEY")
    token: str | None = None

    if not endpoint:
        raise ValueError(
            "AZURE_COMPUTER_VISION_ENDPOINT environment variable must be set"
        )

    if not subscription_key:
        # Managed Identity fallback
        token = get_managed_identity_token()

    # APIエンドポイントとヘッダーの設定
    url = f"{endpoint}/computervision/retrieval:vectorizeImage"
    params = {"api-version": "2024-02-01", "model-version": "2023-04-15"}
    if subscription_key:
        headers = {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": subscription_key,
        }
    else:
        headers = {
            "Content-Type": "application/octet-stream",
            "Authorization": f"Bearer {token}",
        }

    with open(image_path, "rb") as image_file:
        image_data = image_file.read()

    # 指数バックオフでリトライ
    for attempt in range(max_retries + 1):
        try:
            # APIリクエストを送信して画像をベクトル化
            response = requests.post(
                url, headers=headers, params=params, data=image_data
            )
            response.raise_for_status()
            return response.json()["vector"]

        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:  # Too Many Requests
                if attempt < max_retries:
                    # 指数バックオフで待機 (1, 2, 4, 8, 16秒)
                    wait_time = 2**attempt
                    time.sleep(wait_time)
                    continue
                else:
                    raise requests.exceptions.RequestException(
                        f"Rate limit exceeded after {max_retries} retries for {image_path}"
                    ) from e
            else:
                # 429以外のHTTPエラーは即座に再発生
                raise e
        except Exception as e:
            # その他の例外も再発生
            raise e

    # ここには到達しないはずだが、念のため
    raise requests.exceptions.RequestException(
        f"Failed to vectorize image after {max_retries} retries"
    )


def compute_cosine_similarity(vector1: list[float], vector2: list[float]) -> float:
    """
    2つのベクトル間のコサイン類似度を計算する関数

    Args:
        vector1 (list): 最初のベクトル
        vector2 (list): 2番目のベクトル

    Returns:
        float: 2つのベクトル間のコサイン類似度
    """
    v1 = np.array(vector1, dtype=np.float32)
    v2 = np.array(vector2, dtype=np.float32)
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))


def are_images_similar_multiple(
    vector_list: list[list[float]], threshold: float = 0.99
) -> tuple[list[bool], list[list[float]]]:
    """
    複数の画像が類似しているかどうかを判定する関数
    Args:
        vector_list (list): 画像のベクトルのリスト
        threshold (float): 類似度の閾値（0.0から1.0の範囲）。デフォルトは0.99。

    Returns:
        tuple: (各画像が前の画像と類似しているかどうかのブールリスト, 類似していない画像のベクトルリスト)

    Raises:
        ValueError: thresholdが0.0未満または1.0を超える場合
    """
    if threshold < 0.0 or threshold > 1.0:
        raise ValueError("Threshold must be between 0.0 and 1.0")

    # 連続する画像ベクトルペアのコサイン類似度を計算し、閾値と比較
    vector_pairs = [
        (vector_list[i], vector_list[i + 1]) for i in range(len(vector_list) - 1)
    ]

    # 並列実行でコサイン類似度を計算
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures: dict[concurrent.futures.Future[float], int] = {}
        for idx, (a, b) in enumerate(vector_pairs):
            futures[executor.submit(compute_cosine_similarity, a, b)] = idx

        # executor.map も順序を保証するが、明示的に index に基づき再構築して順序保証を分かりやすくする
        cosine_list = [0.0] * len(vector_pairs)
        for future in concurrent.futures.as_completed(futures):
            idx = futures[future]
            cosine_list[idx] = future.result()

    cosine_list.append(0.0)  # 最後の画像は常にFalse（削除しない）

    # 閾値と比較してブールリストを作成
    bool_list = [sim >= threshold for sim in cosine_list]

    # 削除後の画像（類似していない画像）のベクトルリストを作成
    remain_vector_list = [vector_list[i] for i, b in enumerate(bool_list) if not b]

    return bool_list, remain_vector_list


def get_image_vectors_list(
    temp_dir: str,
    container_name: str,
    blob_folder_name: str,
    image_paths_list: list[list[str]],
) -> list[list[list[float]]]:
    """
    画像パスのリストから画像ベクトルのリストを取得する関数
    既にAzure Blob Storageにベクトルファイルが存在する場合はそれをダウンロードし、存在しない場合は新たにベクトル化を行い、Blobにアップロードする

    Args:
        temp_dir (str): 一時ディレクトリのパス
        container_name (str): Azure Blob Storageのコンテナ名
        blob_folder_name (str): Blob内のフォルダ名
        image_paths_list (list[list[str]]): 各ショットのキーフレーム画像パスのリスト

    Returns:
        list[list[list[float]]]: 各ショットの画像ベクトルのリスト
    """
    vector_file_blob_name = f"{blob_folder_name}/image_vectors.npz"
    vector_file_dir = Path(temp_dir, "vectors")
    image_vectors_list = []  # type: list[list[list[float]]]
    try:
        # download_file_from_blob expects output_dir as str
        vector_file_path_str = download_file_from_blob(
            container_name, vector_file_blob_name, str(vector_file_dir)
        )
        with np.load(vector_file_path_str, allow_pickle=True) as data:
            image_vectors_list = data["array"].tolist()

    except ResourceNotFoundError:
        # ファイルが存在しない場合は新規生成
        vector_file_path = Path(vector_file_dir, vector_file_blob_name)
        for image_paths in image_paths_list:
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future_map = {
                    executor.submit(vectorize_image_from_binary_data, image_path): idx
                    for idx, image_path in enumerate(image_paths)
                }
                # 位置を保持するリストを初期化
                vectors: list[list[float]] = [[0.0]] * len(image_paths)
                for future in concurrent.futures.as_completed(future_map):
                    idx = future_map[future]
                    vectors[idx] = future.result()

            image_vectors_list.append(vectors)

        image_vectors_array = np.array(image_vectors_list, dtype=object)
        vector_file_path.parent.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(vector_file_path, array=image_vectors_array)
        _ = upload_file_to_blob(
            str(vector_file_path), container_name, vector_file_blob_name
        )
    return image_vectors_list

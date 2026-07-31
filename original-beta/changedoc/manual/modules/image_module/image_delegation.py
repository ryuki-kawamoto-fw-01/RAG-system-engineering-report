from pathlib import Path

from modules.image_module.image_similarity import are_images_similar_multiple


def delete_image_based_on_similarity(
    image_path_list: list[str],
    vector_list: list[list[float]],
    is_auto_threshold: bool = True,
    similarity_threshold: float = 0.99,
) -> tuple[list[str], list[list[float]]]:
    """
    画像の類似度に基づいて類似画像を削除する関数

    Args:
        image_path_list (list): 画像ファイルのパスのリスト
        vector_list (list): 画像のベクトルのリスト
        is_auto_threshold (bool): 閾値設定を自動化するかどうか。デフォルトはTrue。
        similarity_threshold (float): 類似度の閾値（0.0から1.0の範囲）。デフォルトは0.99。

    Returns:
        tuple: (削除後の画像のパスのリスト, 削除後の画像のベクトルリスト)
    """
    if is_auto_threshold:
        similarity_threshold = 0.99

    if similarity_threshold < 0.0 or similarity_threshold > 1.0:
        raise ValueError("Threshold must be between 0.0 and 1.0")

    if len(vector_list) >= 2:
        bool_list, remain_vector_list = are_images_similar_multiple(vector_list=vector_list, threshold=similarity_threshold)
    else:
        bool_list = [False] * len(vector_list)
        remain_vector_list = vector_list

    new_image_path_list: list[str] = []
    for i, is_similar in enumerate(bool_list):
        if is_similar:
            path = Path(image_path_list[i])
            if path.exists():
                try:
                    path.unlink()
                except OSError:
                    raise OSError(f"Failed to delete file: {image_path_list[i]}")
        else:
            new_image_path_list.append(image_path_list[i])
    return new_image_path_list, remain_vector_list


def pick_segment_images(
    image_paths_list: list[list[str]],
) -> list[list[str]]:
    """
    複数ショットのキーフレーム画像リストから各セグメントの真ん中の画像を選択する関数

    Args:
        image_paths_list (list[list[str]]): 各ショットのキーフレーム画像パスのリスト

    Returns:
        list[list[str]]: 各ショットの真ん中の画像パスのリスト
    """
    remain_image_paths_list: list[list[str]] = []

    for image_paths in image_paths_list:
        if len(image_paths) == 0:
            remain_image_paths_list.append([])
        else:
            # 真ん中のインデックスを計算
            middle_idx = len(image_paths) // 2
            remain_image_paths_list.append([image_paths[middle_idx]])

    return remain_image_paths_list

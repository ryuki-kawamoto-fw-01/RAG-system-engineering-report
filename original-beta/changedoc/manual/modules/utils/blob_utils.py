"""Azure Blob Storage utility functions."""

from __future__ import annotations

import logging
import os
import re
import urllib.parse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Literal

from azure.identity import DefaultAzureCredential
from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    ContainerClient,
    generate_blob_sas,
)
from modules.manual_models import Keyframe


def _get_connection_string() -> str | None:
    """接続文字列 (ローカル開発 / 非MI) を取得。未設定なら None。"""
    return os.environ.get("AZURE_STORAGE_CONNECTION_STRING")


def _get_blob_service_client() -> BlobServiceClient:
    """BlobServiceClient を取得。

    優先順位:
      1. AZURE_STORAGE_CONNECTION_STRING があれば from_connection_string
      2. それ以外で AZURE_STORAGE_ACCOUNT_URL があれば Managed Identity で接続
    どちらも無ければ ValueError。
    """
    conn_str = _get_connection_string()
    account_url = os.getenv(
        "AZURE_STORAGE_ACCOUNT_URL"
    )  # 例: https://<account>.blob.core.windows.net
    if conn_str:
        logging.info("blob.client.mode=connection_string")
        return BlobServiceClient.from_connection_string(conn_str)
    if account_url:
        logging.info("blob.client.mode=managed_identity")
        cred = DefaultAzureCredential()
        return BlobServiceClient(account_url=account_url, credential=cred)
    raise ValueError(
        "Either AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_URL must be set."
    )


def create_container_client(container_name) -> ContainerClient:
    blob_service_client = _get_blob_service_client()
    return blob_service_client.get_container_client(container_name)


def download_file_from_blob(
    container_name: str, blob_name: str, output_dir: str
) -> str:
    """
    Downloads a file from Azure Blob Storage.

    Args:
        container_name (str): The name of the blob container.
        blob_name (str): The name of the blob (file) to download.
        output_dir (str): The local directory to save the downloaded file.

    Returns:
        str: The local file path of the downloaded file.
    """
    blob_name = urllib.parse.unquote(urllib.parse.unquote(blob_name))
    container_client = create_container_client(container_name)
    blob_client = container_client.get_blob_client(blob=blob_name)
    download_stream = blob_client.download_blob()

    local_file_path = Path(output_dir, blob_name)
    local_file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(local_file_path, "wb") as download_file:
        download_file.write(download_stream.readall())
    return str(local_file_path)


def upload_content_to_blob(
    content: str | bytes, container_name: str, blob_name: str
) -> str:
    """Upload text (str) or binary (bytes) content to Azure Blob Storage.

    This function now safely accepts either a Python string (which will be UTF-8 encoded)
    or raw bytes (which will be uploaded as-is). This change prevents AttributeError when
    callers pass image bytes.

    Args:
        content (str | bytes): The content to upload.
        container_name (str): The name of the blob container.
        blob_name (str): The name of the blob (file) to create or overwrite.

    Returns:
        str: The URL of the uploaded blob.
    """
    container_client = create_container_client(container_name)
    blob_client = container_client.get_blob_client(blob=blob_name)
    data = content.encode("utf-8") if isinstance(content, str) else content
    blob_client.upload_blob(data, overwrite=True)

    # SAS 生成: 接続文字列利用時はアカウントSAS、Managed Identity時は user delegation key
    conn_str = _get_connection_string()
    expiry = datetime.utcnow() + timedelta(hours=1)
    permission = BlobSasPermissions(read=True, write=True, create=True, add=True)
    
    if conn_str:
        # 接続文字列モード: Account SAS を生成
        # 接続文字列からアカウント名とアカウントキーを抽出
        import re
        account_name_match = re.search(r'AccountName=([^;]+)', conn_str)
        account_key_match = re.search(r'AccountKey=([^;]+)', conn_str)
        
        if account_name_match and account_key_match:
            account_name = account_name_match.group(1)
            account_key = account_key_match.group(1)
            
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=blob_client.container_name,
                blob_name=blob_client.blob_name,
                account_key=account_key,
                permission=permission,
                expiry=expiry,
            )
            return f"{blob_client.url}?{sas_token}"
        else:
            logging.warning("Failed to extract account name/key from connection string")
            return blob_client.url
    else:
        # Managed Identity モード: user delegation key 必須
        service_client = _get_blob_service_client()
        user_delegation_key = service_client.get_user_delegation_key(
            key_start_time=datetime.utcnow(), key_expiry_time=expiry
        )
        sas_token = generate_blob_sas(
            account_name=blob_client.account_name,
            container_name=blob_client.container_name,
            blob_name=blob_client.blob_name,
            user_delegation_key=user_delegation_key,
            permission=permission,
            expiry=expiry,
        )
        return f"{blob_client.url}?{sas_token}"


def generate_write_sas_url(
    container_name: str, blob_name: str, expiry_hours: int = 1
) -> str:
    """書き込み権限付きユーザー委任SAS URLを生成（アップロード前に呼び出す）

    フロントエンドから直接Blob Storageにアップロードするための
    SAS付きURLを事前に生成します。

    Args:
        container_name (str): The name of the blob container.
        blob_name (str): The name of the blob (file) to create.
        expiry_hours (int): SASトークンの有効期限（時間）。デフォルトは1時間。

    Returns:
        str: 書き込み権限付きSAS URL

    Raises:
        ValueError: SASトークンの生成に失敗した場合
    """
    container_client = create_container_client(container_name)
    blob_client = container_client.get_blob_client(blob=blob_name)

    expiry = datetime.utcnow() + timedelta(hours=expiry_hours)
    permission = BlobSasPermissions(read=True, write=True, create=True, add=True)

    # ユーザー委任SASを生成
    service_client = _get_blob_service_client()
    user_delegation_key = service_client.get_user_delegation_key(
        key_start_time=datetime.utcnow(), key_expiry_time=expiry
    )
    sas_token = generate_blob_sas(
        account_name=blob_client.account_name,
        container_name=blob_client.container_name,
        blob_name=blob_client.blob_name,
        user_delegation_key=user_delegation_key,
        permission=permission,
        expiry=expiry,
    )
    return f"{blob_client.url}?{sas_token}"


def generate_read_sas_url(
    container_name: str, blob_name: str, expiry_hours: int = 1
) -> str:
    """読み取り専用SAS URLを生成（既存ファイルへのアクセス用）

    マネージドID認証を使用してユーザー委任SASトークンを生成します。

    Args:
        container_name (str): The name of the blob container.
        blob_name (str): The name of the blob (file) to access.
        expiry_hours (int): SASトークンの有効期限（時間）。デフォルトは1時間。

    Returns:
        str: 読み取り権限付きSAS URL

    Raises:
        ValueError: SASトークンの生成に失敗した場合
        Exception: ファイルが存在しない場合
    """
    container_client = create_container_client(container_name)
    blob_client = container_client.get_blob_client(blob=blob_name)

    # ファイルの存在確認
    if not blob_client.exists():
        raise Exception(f"ファイルが存在しません: {blob_name}")

    expiry = datetime.utcnow() + timedelta(hours=expiry_hours)
    permission = BlobSasPermissions(read=True)

    # マネージドID認証: ユーザー委任キーを使用してSASトークンを生成
    service_client = _get_blob_service_client()
    user_delegation_key = service_client.get_user_delegation_key(
        key_start_time=datetime.utcnow(), key_expiry_time=expiry
    )
    sas_token = generate_blob_sas(
        account_name=blob_client.account_name,
        container_name=blob_client.container_name,
        blob_name=blob_client.blob_name,
        user_delegation_key=user_delegation_key,
        permission=permission,
        expiry=expiry,
    )
    return f"{blob_client.url}?{sas_token}"


def upload_file_to_blob(
    local_file_path: str, container_name: str, blob_name: str
) -> str:
    """
    Uploads a local file to Azure Blob Storage.
    Args:
        local_file_path (str): The path to the local file to upload.
        container_name (str): The name of the blob container.
        blob_name (str): The name of the blob (file) to create or overwrite.
    Returns:
        str: The URL of the uploaded blob.
    """
    container_client = create_container_client(container_name)
    blob_client = container_client.get_blob_client(blob=blob_name)
    with open(local_file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)
    return blob_client.url


def download_blob(
    container_name: str, blob_name: str
) -> tuple[bytes, Any | Literal["application/octet-stream"]]:
    """
    Downloads a file from Azure Blob Storage.

    Args:
        container_name (str): The name of the blob container.
        blob_name (str): The name of the blob (file) to download.
        output_dir (str): The local directory to save the downloaded file.

    Returns:
        bytes (bytes): The downloaded file.
        content_type (Any | Literal['application/octet-stream']): The content type of the downloaded file.
    """
    blob_name = urllib.parse.unquote(urllib.parse.unquote(blob_name))
    container_client = create_container_client(container_name)
    blob_client = container_client.get_blob_client(blob=blob_name)

    if not blob_client.exists():
        logging.error(f"Blob not found: {blob_name}")
        raise ValueError("指定されたファイルは存在しません")

    try:
        download_stream = blob_client.download_blob()
        content_data = download_stream.readall()
    except Exception as e:
        logging.error(f"Blob download failed for {blob_name}: {e}")
        raise ValueError("ファイルのダウンロードに失敗しました")

    properties = blob_client.get_blob_properties()
    content_type = (
        properties.content_settings.content_type
        if properties.content_settings and properties.content_settings.content_type
        else "application/octet-stream"
    )

    return content_data, content_type


def download_blob_content(blob_url: str) -> str:
    """BlobのURLからコンテンツを文字列として取得する

    Args:
        blob_url: BlobのURL

    Returns:
        Blobの内容（文字列）
    """
    import requests

    response = requests.get(blob_url)
    response.raise_for_status()
    return response.text


def get_keyframe_urls_from_container(
    container_name: str, folder_path: str
) -> list[Keyframe]:
    """指定されたコンテナとフォルダからキーフレーム画像情報のリストを取得する

    Args:
        container_name: Azureストレージのコンテナ名
        folder_path: キーフレーム画像が格納されているフォルダパス

    Returns:
        Keyframeオブジェクトのリスト（url, name, frameIdxを含む）
    """
    import logging

    logger = logging.getLogger(__name__)

    try:
        logger.info(
            f"🎬 Getting keyframes from container: {container_name}, folder: {folder_path}"
        )

        blob_service_client = _get_blob_service_client()
        container_client = blob_service_client.get_container_client(container_name)

        # キーフレーム画像を取得
        keyframes: list[Keyframe] = []
        blob_list = container_client.list_blobs(name_starts_with=folder_path)

        blob_count = 0
        image_files = []

        # まず全ての画像ファイルを収集
        for blob in blob_list:
            blob_count += 1
            logger.info(f"🔍 Found blob: {blob.name}")

            if blob.name.endswith((".png", ".jpg", ".jpeg")):
                image_files.append(blob.name)
                logger.info(f"📷 Image file found: {blob.name}")

        logger.info(f"📊 Total blobs: {blob_count}, Image files: {len(image_files)}")

        # キーフレーム画像を特定（複数のパターンを試す）
        keyframe_patterns = [
            "keyframe",  # keyframe_001.png
            "frame",  # frame_001.png
            "img",  # img_001.png
            "screenshot",  # screenshot_001.png
            ".png",  # すべてのPNG画像
            ".jpg",  # すべてのJPG画像
            ".jpeg",  # すべてのJPEG画像
        ]

        for blob_name in image_files:
            is_keyframe = False
            matched_pattern = None

            # キーフレームパターンをチェック
            for pattern in keyframe_patterns:
                if pattern.lower() in blob_name.lower():
                    is_keyframe = True
                    matched_pattern = pattern
                    break

            if is_keyframe:
                try:
                    # SAS付きURLを生成
                    sas_url = generate_read_sas_url(
                        container_name, blob_name, expiry_hours=24
                    )
                    
                    # ファイル名からframeIdxを抽出（例: keyFrame.920.jpg -> 920）
                    frame_idx = 0
                    frame_match = re.search(r'[._](\d+)\.(jpg|jpeg|png)$', blob_name, re.IGNORECASE)
                    if frame_match:
                        frame_idx = int(frame_match.group(1))
                    
                    # ファイル名を取得
                    file_name = Path(blob_name).name
                    
                    keyframe = Keyframe(url=sas_url, name=file_name, frameIdx=frame_idx)
                    keyframes.append(keyframe)
                    logger.info(
                        f"📸 Added keyframe {len(keyframes)} (pattern: {matched_pattern}, frameIdx: {frame_idx}): {blob_name}"
                    )
                except Exception as sas_error:
                    logger.warning(
                        f"⚠️ SAS generation failed for {blob_name}, using direct URL: {sas_error}"
                    )
                    blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{blob_name}"
                    
                    # ファイル名からframeIdxを抽出
                    frame_idx = 0
                    frame_match = re.search(r'[._](\d+)\.(jpg|jpeg|png)$', blob_name, re.IGNORECASE)
                    if frame_match:
                        frame_idx = int(frame_match.group(1))
                    
                    file_name = Path(blob_name).name
                    keyframe = Keyframe(url=blob_url, name=file_name, frameIdx=frame_idx)
                    keyframes.append(keyframe)

        logger.info(
            f"📊 Processed {blob_count} total blobs, found {len(keyframes)} keyframe images"
        )

        # frameIdxでソート
        keyframes.sort(key=lambda k: k.frameIdx)

        if keyframes:
            logger.info(f"✅ Successfully retrieved {len(keyframes)} keyframes")
            logger.info(f"🎯 First keyframe: {keyframes[0].name} (frameIdx: {keyframes[0].frameIdx})")
        else:
            logger.warning(f"⚠️ No keyframe images found in {folder_path}")

        return keyframes

    except Exception as e:
        logger.error(f"❌ キーフレーム画像の取得に失敗: {str(e)}")
        raise Exception(f"キーフレーム画像の取得に失敗: {str(e)}")

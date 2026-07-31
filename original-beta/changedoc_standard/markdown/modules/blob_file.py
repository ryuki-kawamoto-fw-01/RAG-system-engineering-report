import logging
import os
from typing import Optional

from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient, ContainerClient

# 環境変数
AZURE_BLOB_STORAGE_SRC_CONTAINER = "AZURE_BLOB_STORAGE_SRC_CONTAINER"
AZURE_BLOB_STORAGE_DST_CONTAINER = "AZURE_BLOB_STORAGE_DST_CONTAINER"
SRC_CONTAINER_CONN_STR_ENV = "AZURE_BLOB_STORAGE_SRC_CON_STR"
DST_CONTAINER_CONN_STR_ENV = "AZURE_BLOB_STORAGE_DST_CON_STR"

credential = DefaultAzureCredential()

# コンテナー名の取得
SrcContainer = os.environ.get(AZURE_BLOB_STORAGE_SRC_CONTAINER, "")
DstContainer = os.environ.get(AZURE_BLOB_STORAGE_DST_CONTAINER)


def create_src_container_client() -> Optional[ContainerClient]:
    try:
        # 入力コンテナー設定
        if not SrcContainer:
            logging.error(f"環境変数{AZURE_BLOB_STORAGE_SRC_CONTAINER}が設定されていません")
            return None
        blob_con_str = os.environ[SRC_CONTAINER_CONN_STR_ENV]
        blob_service = BlobServiceClient(account_url=blob_con_str, credential=credential)
        return blob_service.get_container_client(SrcContainer)
    except Exception as e:
        logging.error(e)
        return None


def create_dst_container_client() -> Optional[ContainerClient]:
    try:
        # アップロード先コンテナー設定
        if not DstContainer:
            logging.error(f"環境変数{AZURE_BLOB_STORAGE_DST_CONTAINER}が設定されていません")
            return None
        blob_con_str = os.environ[DST_CONTAINER_CONN_STR_ENV]
        blob_service = BlobServiceClient(account_url=blob_con_str, credential=credential)
        return blob_service.get_container_client(DstContainer)
    except Exception as e:
        logging.error(e)
        return None


def get_dst_file_path(src_path):
    return os.path.splitext(src_path)[0] + ".txt"

import os
from datetime import datetime, timedelta

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    ContainerClient,
    generate_blob_sas,
)

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

TEMPFILE_CONNECTION_STRING_ENV = "TEMPFILE_CONNECTION_STRING"
TEMPFILE_CONTAINER_NAME = "TEMPFILE_CONTAINER_NAME"


def create_tempfile_container_client() -> ContainerClient:
    blob_conn_str = os.environ[TEMPFILE_CONNECTION_STRING_ENV]
    blob_container = os.environ[TEMPFILE_CONTAINER_NAME]
    blob_service_client = BlobServiceClient(
        account_url=blob_conn_str, credential=credential
    )
    return blob_service_client.get_container_client(blob_container)


def generate_sas_url(blob_name: str, expiry_seconds: int = 3600) -> str:
    blob_conn_str = os.environ[TEMPFILE_CONNECTION_STRING_ENV]
    blob_service_client = BlobServiceClient(
        account_url=blob_conn_str, credential=credential
    )
    blob_container = os.environ[TEMPFILE_CONTAINER_NAME]

    # Create a BlobClient
    blob_client = blob_service_client.get_blob_client(
        container=blob_container, blob=blob_name
    )
    if not blob_client.exists():
        raise ValueError("ファイルが存在しません")
    account_name = blob_service_client.account_name
    if not account_name:
        raise ValueError("ストレージアカウントの取得に失敗しました")

    # Generate SAS token
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=blob_client.container_name,
        blob_name=blob_client.blob_name,
        user_delegation_key=blob_service_client.get_user_delegation_key(
            key_start_time=datetime.utcnow(),
            key_expiry_time=datetime.utcnow() + timedelta(hours=1),
        ),
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(seconds=expiry_seconds),
    )

    blob_url = blob_client.url
    signed_url = f"{blob_url}?{sas_token}"

    return signed_url

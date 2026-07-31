import os
from datetime import datetime, timedelta
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient, ContainerClient, generate_blob_sas, BlobSasPermissions


def create_service_client() -> BlobServiceClient:
    identity = DefaultAzureCredential()
    blob_conn_str = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    return BlobServiceClient(account_url=blob_conn_str, credential=identity)


def create_container_client(container_name) -> ContainerClient:
    # blob_container = os.environ["AZURE_STORAGE_CONTAINER"]
    blob_service_client = create_service_client()
    return blob_service_client.get_container_client(container_name)

def generate_sas_url(container_name: str, blob_name: str, expiry_seconds: int = 3600) -> str:
    blob_service_client = create_service_client()
    # blob_container = os.environ["AZURE_STORAGE_CONTAINER"]
    
    # Create a BlobClient
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
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
            key_start_time=datetime.utcnow(), key_expiry_time=datetime.utcnow() + timedelta(hours=1)
        ),
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(seconds=expiry_seconds)
    )
    
    blob_url = blob_client.url
    signed_url = f"{blob_url}?{sas_token}"
    
    return signed_url


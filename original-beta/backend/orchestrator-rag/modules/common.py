import os

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.storage.blob import (
    BlobServiceClient,
    ContainerClient,
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


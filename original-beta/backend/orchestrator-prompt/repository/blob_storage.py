import logging
import os
import uuid
from datetime import datetime, timedelta

from azure.identity import DefaultAzureCredential
from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    ContentSettings,
    generate_blob_sas,
)


class BlobStorageService:
    """Azure Blob Storageへの画像アップロード・ダウンロード・SAS生成を管理"""

    def __init__(self, container_name: str = None):
        self.account_name = os.environ.get("AZURE_STORAGE_ACCOUNT_NAME")
        # container_nameが指定されていない場合は環境変数から取得
        self.container_name = container_name or os.environ.get(
            "AZURE_STORAGE_CONTAINER_NAME", "images"
        )

        if not self.account_name:
            logging.error("AZURE_STORAGE_ACCOUNT_NAME environment variable is not set")
            raise ValueError(
                "AZURE_STORAGE_ACCOUNT_NAME environment variable is required"
            )

        logging.info(
            f"Initializing BlobStorageService with account: {self.account_name}, container: {self.container_name}"
        )

        # Managed Identityを使用してBlobServiceClientを作成
        credential = DefaultAzureCredential()
        account_url = f"https://{self.account_name}.blob.core.windows.net"
        self.blob_service_client = BlobServiceClient(
            account_url=account_url, credential=credential
        )
        self.container_client = self.blob_service_client.get_container_client(
            self.container_name
        )

    def upload_image(self, image_bytes: bytes, file_extension: str = "png") -> str:
        """
        画像をBlob Storageにアップロード

        Args:
            image_bytes: 画像のバイナリデータ
            file_extension: ファイル拡張子（デフォルト: png）

        Returns:
            blob_name: アップロードされた画像のblob名
        """
        try:
            # 一意なblob名を生成（コンテナ名は既に"images"なのでプレフィックス不要）
            blob_name = f"{datetime.utcnow().strftime('%Y%m%d')}/{uuid.uuid4()}.{file_extension}"

            logging.info(f"Uploading image to blob: {blob_name}")

            # ファイル拡張子に基づいて正しいMIMEタイプを設定
            # jpgとjpegは両方ともimage/jpegとして扱う
            mime_type = f"image/{file_extension}"
            if file_extension.lower() in ["jpg", "jpeg"]:
                mime_type = "image/jpeg"

            # Blobクライアントを取得してアップロード
            blob_client = self.container_client.get_blob_client(blob_name)
            blob_client.upload_blob(
                image_bytes,
                overwrite=True,
                content_settings=ContentSettings(content_type=mime_type),
            )

            logging.info(f"Successfully uploaded image: {blob_name}")
            return blob_name

        except Exception as e:
            logging.error(f"Failed to upload image to blob storage: {e}", exc_info=True)
            raise

    def download_image(self, blob_name: str) -> bytes:
        """
        Blob Storageから画像をダウンロード

        Args:
            blob_name: ダウンロードする画像のblob名

        Returns:
            image_bytes: 画像のバイナリデータ
        """
        try:
            logging.info(f"Downloading image from blob: {blob_name}")

            blob_client = self.container_client.get_blob_client(blob_name)
            image_bytes = blob_client.download_blob().readall()

            logging.info(f"Successfully downloaded image: {blob_name}")
            return image_bytes

        except Exception as e:
            logging.error(
                f"Failed to download image from blob storage: {e}", exc_info=True
            )
            raise

    def generate_sas_url(self, blob_name: str, expiry_hours: int = 1) -> str:
        """
        SASトークン付きURLを生成（User Delegation SASを使用）

        Args:
            blob_name: 対象のblob名
            expiry_hours: SASトークンの有効期限（時間）

        Returns:
            sas_url: SASトークン付きURL
        """
        try:
            logging.info(f"Generating User Delegation SAS URL for blob: {blob_name}")

            # User Delegation Keyを取得（Managed Identityで可能）
            start_time = datetime.utcnow()
            expiry_time = start_time + timedelta(hours=expiry_hours)

            # User Delegation Keyを取得
            user_delegation_key = self.blob_service_client.get_user_delegation_key(
                key_start_time=start_time, key_expiry_time=expiry_time
            )

            # User Delegation SASトークンを生成
            sas_token = generate_blob_sas(
                account_name=self.account_name,
                container_name=self.container_name,
                blob_name=blob_name,
                user_delegation_key=user_delegation_key,
                permission=BlobSasPermissions(read=True),
                expiry=expiry_time,
                start=start_time,
            )

            # 完全なURLを構築
            blob_client = self.container_client.get_blob_client(blob_name)
            sas_url = f"{blob_client.url}?{sas_token}"

            logging.info(
                f"Successfully generated User Delegation SAS URL for: {blob_name}"
            )
            return sas_url

        except Exception as e:
            logging.error(f"Failed to generate SAS URL: {e}", exc_info=True)
            # フォールバックとして直接URLを返す（公開アクセスが必要）
            logging.warning("Falling back to direct URL without SAS token")
            blob_client = self.container_client.get_blob_client(blob_name)
            return blob_client.url

    def delete_image(self, blob_name: str) -> bool:
        """
        Blob Storageから画像を削除

        Args:
            blob_name: 削除する画像のblob名

        Returns:
            success: 削除成功したかどうか
        """
        try:
            logging.info(f"Deleting image from blob: {blob_name}")

            blob_client = self.container_client.get_blob_client(blob_name)
            blob_client.delete_blob()

            logging.info(f"Successfully deleted image: {blob_name}")
            return True

        except Exception as e:
            logging.error(
                f"Failed to delete image from blob storage: {e}", exc_info=True
            )
            return False

    def download_file(self, file_path: str) -> bytes:
        """
        指定されたパスからファイルをダウンロード

        Args:
            file_path: ダウンロードするファイルのパス（例: "temp/xxx.pdf", "documents/report.docx"）

        Returns:
            bytes: ファイルのバイナリデータ

        Raises:
            Exception: ファイルのダウンロードに失敗した場合
        """
        try:
            logging.info(f"Downloading file: {file_path}")

            blob_client = self.container_client.get_blob_client(file_path)
            file_bytes = blob_client.download_blob().readall()

            logging.info(f"Successfully downloaded file: {file_path}")
            return file_bytes

        except Exception as e:
            logging.error(
                f"Failed to download file from blob storage: {e}", exc_info=True
            )
            raise

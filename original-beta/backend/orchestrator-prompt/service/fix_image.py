import base64
import logging
import time
from datetime import datetime, timedelta

import azure.functions as func
import requests

from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.image_generation import FixImagePostRequest


class FixImageService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        self.blob_storage = BlobStorageService()

    def body_parser(self) -> FixImagePostRequest:
        req_body = self.request.get_json()
        blob_name = req_body.get("blobName")
        fix_image_request = req_body.get("fixImageRequest")
        image_size = req_body.get("imageSize")
        image_format = req_body.get("imageFormat")

        params = FixImagePostRequest(
            blobName=blob_name,
            fixImageRequest=fix_image_request,
            imageSize=image_size,
            imageFormat=image_format,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_fix_image(self):
        start_time = time.time()
        params = self.body_parser()
        blob_name = params.blobName
        fix_image_request = params.fixImageRequest
        image_size = params.imageSize
        image_format = params.imageFormat

        # Blob Storageから元の画像をダウンロード
        logging.info(f"Downloading original image from blob: {blob_name}")
        image_bytes = self.blob_storage.download_image(blob_name)

        # Base64に変換
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        logging.info(
            f"[FixImageService] Downloaded image, Base64 length: {len(image_base64)}"
        )

        # 画像修正を実行
        answer = AoaiRepository.create_aoai_fix_image(
            image=image_base64,
            prompt=fix_image_request,
            output_format=image_format,
            size=image_size,
        )

        # 修正後の画像をバイナリに変換
        if answer.startswith("http"):
            # URLの場合はダウンロード
            image_response = requests.get(answer)
            fixed_image_bytes = image_response.content
        else:
            # Base64の場合はデコード
            fixed_image_bytes = base64.b64decode(answer)

        # 修正後の画像をBlob Storageにアップロード
        new_blob_name = self.blob_storage.upload_image(fixed_image_bytes, image_format)

        # SASトークン付きURLを生成（有効期限: 24時間）
        sas_url = self.blob_storage.generate_sas_url(new_blob_name, expiry_hours=24)

        # 有効期限を計算
        expiry_time = (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"

        # レスポンスタイムを計算
        response_time = time.time() - start_time

        response_data = {
            "image_url": sas_url,
            "blob_name": new_blob_name,
            "expiry_time": expiry_time,
            "success": True,
            "log": {
                "responseTime": response_time,
            },
        }

        return response_data

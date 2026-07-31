import base64
import logging
import time
from datetime import datetime, timedelta

import azure.functions as func
import requests

from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.image_generation import ImagePostRequest


class ImageGenerationService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        self.blob_storage = BlobStorageService()

    def body_parser(self) -> ImagePostRequest:
        req_body = self.request.get_json()
        image_content = req_body.get("imageContent")
        image_size = req_body.get("imageSize")
        image_format = req_body.get("imageFormat")

        params = ImagePostRequest(
            imageContent=image_content,
            imageSize=image_size,
            imageFormat=image_format,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_image_generation(self):
        start_time = time.time()
        params = self.body_parser()
        image_content = params.imageContent
        image_size = params.imageSize
        image_format = params.imageFormat

        # 画像生成
        answer = AoaiRepository.create_aoai_image(
            prompt=image_content,
            size=image_size,
            output_format=image_format,
        )

        # 画像をバイナリに変換
        if answer.startswith("http"):
            # URLの場合はダウンロード
            image_response = requests.get(answer)
            image_bytes = image_response.content
        else:
            # Base64の場合はデコード
            image_bytes = base64.b64decode(answer)

        # Blob Storageにアップロード
        blob_name = self.blob_storage.upload_image(image_bytes, image_format)

        # SASトークン付きURLを生成（有効期限: 24時間）
        sas_url = self.blob_storage.generate_sas_url(blob_name, expiry_hours=24)

        # 有効期限を計算
        expiry_time = (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"

        # レスポンスタイムを計算
        response_time = time.time() - start_time

        response_data = {
            "image_url": sas_url,
            "blob_name": blob_name,
            "expiry_time": expiry_time,
            "success": True,
            "log": {
                "responseTime": response_time,
            },
        }

        return response_data

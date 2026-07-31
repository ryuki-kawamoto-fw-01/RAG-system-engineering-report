import json
import logging
import os
import re
from io import BytesIO

import azure.functions as func

from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.trouble_shooting_guide import FileReference, TroubleShootingGuidePostRequest
from system.trouble_shooting_guide import create_trouble_shooting_guide_system_message


class TroubleShootingGuideService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        # BlobStorageServiceの初期化
        self.blob_storage = BlobStorageService(
            container_name=os.environ["AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME"]
        )

    def form_parser(self) -> TroubleShootingGuidePostRequest:
        form = self.request.form

        # フォームデータの取得
        productName = form.get("productName")
        productPurpose = form.get("productPurpose")
        productSpecificationText = form.get("productSpecificationText")

        params = TroubleShootingGuidePostRequest(
            productName=productName,
            productPurpose=productPurpose,
            productSpecificationText=productSpecificationText,
        )
        logging.info(f"Request form: {params}")

        params = TroubleShootingGuidePostRequest(
            productName=productName,
            productPurpose=productPurpose,
            productSpecificationText=productSpecificationText,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        """Blob Storageからファイルを読み込んで処理"""
        form = self.request.form
        if form is None:
            raise ValueError("Form data is required")

        file_list_json = form.get("productSpecificationFiles")
        text = form.get("productSpecificationText")

        # 直接入力の場合
        if not file_list_json and text:
            logging.info(f"Direct text input: {text[:100]}...")
            original_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", text)
            return original_text

        # ファイルアップロードの場合
        if not file_list_json:
            raise ValueError(
                "productSpecificationFiles or productSpecificationText is required"
            )

        # JSONパースとPydanticバリデーション
        try:
            file_list_raw = (
                json.loads(file_list_json)
                if isinstance(file_list_json, str)
                else file_list_json
            )
            file_list = [FileReference(**file_ref) for file_ref in file_list_raw]
            logging.info(f"Parsed file_list: {file_list}")
        except (json.JSONDecodeError, Exception) as e:
            logging.error(f"Failed to parse fileList: {e}", exc_info=True)
            raise ValueError(f"productSpecificationFilesの形式が不正です: {e}")

        # Blob Storageからファイルを読み込み
        productSpecificationText = ""
        for file_ref in file_list:
            file_path = file_ref.name

            try:
                logging.info(f"Downloading file: {file_path}")
                file_bytes = self.blob_storage.download_file(file_path)
                logging.info(
                    f"Successfully downloaded: {file_path}, size: {len(file_bytes)} bytes"
                )

                # ファイル拡張子を取得
                extension = file_path.split(".")[-1].lower()
                file_name = file_path.split("/")[-1]

                # テキスト抽出
                content_text = get_file_content(file_bytes, extension)
                logging.info(
                    f"Processed file: {file_name}, content length: {len(content_text)}"
                )
                productSpecificationText += f"{content_text}\n"

            except Exception as e:
                logging.error(f"Failed to process file {file_path}: {e}", exc_info=True)
                # LLMSpecificError はそのまま再送出して上位でハンドリング
                raise

        # 制御文字のうち、\n（改行）と\t（タブ）は許可し、それ以外を除去
        original_text = re.sub(
            r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", productSpecificationText
        )

        return original_text

    def post_trouble_shooting_guide(self):
        productName = self.form_parser().productName
        productPurpose = self.form_parser().productPurpose
        productSpecification = self.file_parser()
        messages = create_trouble_shooting_guide_system_message(
            productSpecification, productName, productPurpose
        )
        logging.info(f"Generated messages: {messages}")
        answer = self.repository.create_aoai_answer(messages=messages)

        response_data = {
            "answer": answer,
            # 成功フラグ
            "success": True,
        }

        return response_data

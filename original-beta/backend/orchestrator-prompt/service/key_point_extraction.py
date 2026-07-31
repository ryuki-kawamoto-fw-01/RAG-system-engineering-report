import json
import logging
import os
import re
from io import BytesIO

import azure.functions as func

from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.key_point_extraction import KeyPointExtractionPostRequest
from system.key_point_extraction import get_key_point_extraction_message


class KeyPointExtractionService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        # BlobStorageServiceの初期化（一時ファイル用コンテナを指定）
        self.blob_storage = BlobStorageService(
            container_name=os.environ.get("AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME")
        )

    def form_parser(self) -> KeyPointExtractionPostRequest:
        form = self.request.form
        if form is None:
            raise ValueError("Form data is required")

        # フォームデータの取得
        text = form.get("text")
        additionalConsiderations = form.get("additionalConsiderations")

        params = KeyPointExtractionPostRequest(
            fileList=None,
            text=text,
            additionalConsiderations=additionalConsiderations,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        original_text = ""
        form = self.request.form
        if form is None:
            raise ValueError("Form data is required")

        text = form.get("text")
        file_list_json = form.get("fileList")

        # FileReferenceからファイルを読み込む
        if file_list_json:
            try:
                file_references = json.loads(file_list_json)
                logging.info(f"Received file_references: {file_references}")

                for file_ref in file_references:
                    file_name = file_ref.get("name")
                    logging.info(f"Processing file: {file_name}")

                    # Blob Storageからファイルをダウンロード
                    file_stream = self.blob_storage.download_file(file_name)
                    if file_stream:
                        # BytesIOに変換
                        file_bytes = BytesIO(file_stream)
                        # ファイル名から拡張子を抽出
                        file_extension = file_name.split(".")[-1].lower()
                        # get_file_contentでテキストを抽出
                        content_text = get_file_content(
                            file_bytes.read(), file_extension
                        )
                        logging.info(f"Extracted content from {file_name}")
                        original_text += f"{content_text}\n"
                    else:
                        logging.error(f"Failed to download file: {file_name}")
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse fileList JSON: {e}")
                raise ValueError("ファイルリストの形式が不正です")
        elif text:
            # 入力形式が直接入力の場合
            original_text = text
            logging.info(f"Received text: {original_text}")
        else:
            # ファイルもテキストもない場合はエラー
            logging.error("fileList or text is required")
            raise ValueError("ファイルまたはテキストは必須です")

        # 制御文字のうち、\n（改行）と\t（タブ）は許可し、それ以外を除去
        original_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", original_text)

        return original_text

    def post_key_point_extraction(self):
        original_text = self.file_parser()
        additional_considerations = self.form_parser().additionalConsiderations

        answer = self.repository.create_aoai_answer_reasoning(
            get_key_point_extraction_message(
                additional_considerations or "",
                original_text,
            )
        )

        response_data = {
            "key_point_extraction_result": answer,
            "success": True,
        }

        return response_data

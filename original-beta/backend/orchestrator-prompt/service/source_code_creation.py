import json
import logging
import os
import re

import azure.functions as func
from pydantic import ValidationError

from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.source_code_creation import CreateSourceCodePostRequest, FileReference
from system.source_code_creation import get_create_source_code_message


class CreateSourceCodeService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        # Blob Storageサービスの初期化
        self.blob_storage = BlobStorageService(
            container_name=os.environ["AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME"]
        )

    def body_parser(self) -> CreateSourceCodePostRequest:
        languageSelect = self.request.form.get("languageSelect")
        inputMessage = self.request.form.get("inputMessage")
        pastQA = self.request.form.get("pastQA")

        params = CreateSourceCodePostRequest(
            languageSelect=languageSelect,
            inputMessage=inputMessage,
            pastQA=pastQA,
        )
        logging.info(f"Request body: {params}")
        return params

    def file_parser(self) -> str:
        """
        ファイルパスのリストを受け取り、Blob Storageからファイルを読み込んで処理
        """
        form = self.request.form

        if form is None:
            logging.error("form が None です")
            raise ValueError("入力が不正です")

        file_list_json = form.get("fileList")

        if file_list_json is None:
            logging.info("fileList is not provided, returning empty content")
            return ""  # ファイルがない場合は空文字列を返す

        try:
            file_list_raw = json.loads(file_list_json)
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse fileList JSON: {e}")
            raise ValueError("fileListの形式が不正です")

        try:
            file_list = [FileReference(**file_ref) for file_ref in file_list_raw]
        except ValidationError as e:
            logging.error(f"FileReference validation failed: {e}")
            raise ValueError(f"fileListの形式が不正です: {e}")

        logging.info(f"Received file_list: {file_list}")

        file_content = ""
        for file_ref in file_list:
            file_path = file_ref.name
            try:
                # Blob Storageからファイルを読み込む
                logging.info(f"Downloading file from blob: {file_path}")
                file_bytes = self.blob_storage.download_file(file_path)

                # ファイル拡張子を取得
                extension = file_path.split(".")[-1] if "." in file_path else ""
                file_name = file_path.split("/")[-1]

                # ファイル内容をテキストに変換
                content_text = get_file_content(file_bytes, extension)
                logging.info(
                    f"File - Name: {file_name}, Extension: {extension}, Content length: {len(content_text)}"
                )
                file_content += f"## {file_name}\n{content_text}\n"

            except Exception as e:
                logging.error(
                    f"Failed to process file - Path: {file_path}, Error: {str(e)}",
                    exc_info=True,
                )
                raise

        # 制御文字のうち、\n（改行）と\t（タブ）は許可し、それ以外を除去
        file_content = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", file_content)

        return file_content

    def post_create_source_code(self):
        languageSelect = self.body_parser().languageSelect
        inputMessage = self.body_parser().inputMessage
        pastQA = self.body_parser().pastQA
        file_content = self.file_parser()

        chat, source_code = self.repository.parse_aoai_answer_source_code(
            get_create_source_code_message(
                languageSelect,
                inputMessage,
                pastQA,
                file_content,
            )
        )

        response_data = {
            "chat": chat,
            "source_code": source_code,
            "success": True,
        }

        return response_data

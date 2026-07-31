import json
import logging
import os

import azure.functions as func
from pydantic import ValidationError

from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.create_minutes import CreateMinutesPostRequest, FileReference
from system.create_minutes import get_system_message, get_user_message


class CreateMinutesService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        self.blob_storage = BlobStorageService(
            container_name=os.environ["AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME"]
        )

    def body_parser(self) -> CreateMinutesPostRequest:
        form = self.request.form
        meeting_purpose = form.get("meetingPurpose")

        params = CreateMinutesPostRequest(meeting_purpose=meeting_purpose)
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
            logging.error("fileList is required")
            raise ValueError("入力が不正です")

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

        original_text = ""
        for file_ref in file_list:
            file_path = file_ref.name
            file_type = file_ref.type
            try:
                # Blob Storageからファイルを読み込む
                logging.info(f"Downloading file from blob: {file_path}")
                content_bytes = self.blob_storage.download_file(file_path)

                # ファイル拡張子を取得
                extension = file_path.split(".")[-1] if "." in file_path else ""
                file_name = file_path.split("/")[-1]

                # ファイル内容をテキストに変換
                content_text = get_file_content(content_bytes, extension)
                logging.info(
                    f"File - Name: {file_name}, Extension: {extension}, Content length: {len(content_text)}"
                )
                original_text += f"## {file_name}\n{content_text}\n"

            except Exception as e:
                logging.error(
                    f"Failed to process file - Path: {file_path}, Type: {file_type}, Error: {str(e)}",
                    exc_info=True,
                )
                # LLMSpecificError はそのまま再送出して上位でハンドリング
                raise

        return original_text

    def post_create_minutes(self):
        original_text = self.file_parser()
        meeting_purpose = self.body_parser().meeting_purpose
        logging.info(f"PURPOSE: {meeting_purpose}")

        messages = [
            {"role": "system", "content": get_system_message(meeting_purpose)},
            {
                "role": "user",
                "content": get_user_message(original_text, meeting_purpose),
            },
        ]
        logging.info(f"Messages: {messages}")

        answer = self.repository.create_aoai_answer(messages)
        logging.info(f"Answer: {answer}")

        return {"answer": answer, "temp_file": original_text, "success": True}

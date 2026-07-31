import json
import logging
import os

import azure.functions as func
from pydantic import ValidationError

from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.design_document_review import FileReference
from system.design_document_review import get_user_message


class DesignDocumentReviewService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        self.blob_storage = BlobStorageService(
            container_name=os.environ["AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME"]
        )

    def body_parser(self):
        form = self.request.form
        review_purpose = form.get("reviewPurpose", "")
        priority_point = form.get("priorityPoint", "")
        consideration = form.get("consideration", "")
        return review_purpose, priority_point, consideration

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
                logging.info(f"Downloading file from blob: {file_path}")
                content_bytes = self.blob_storage.download_file(file_path)

                extension = file_path.split(".")[-1] if "." in file_path else ""
                file_name = file_path.split("/")[-1]

                content_text = get_file_content(content_bytes, extension)
                logging.info(
                    f"File - Name: {file_name}, Extension: {extension}, "
                    f"Content length: {len(content_text)}"
                )
                original_text += f"## {file_name}\n{content_text}\n"

            except Exception as e:
                logging.error(
                    f"Failed to process file - Path: {file_path}, "
                    f"Type: {file_type}, Error: {str(e)}",
                    exc_info=True,
                )
                # LLMSpecificError はそのまま再送出して上位でハンドリング
                raise

        return original_text

    def post_designDocumentReview(self):
        original_text = self.file_parser()
        review_purpose, priority_point, consideration = self.body_parser()
        answer = self.repository.create_aoai_answer_reasoning(
            get_user_message(
                original_text,
                review_purpose,
                priority_point,
                consideration,
            )
        )
        response_data = {
            "answer": answer,
            "temp_file": original_text,
            "success": True,
        }
        return response_data

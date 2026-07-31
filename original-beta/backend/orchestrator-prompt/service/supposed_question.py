import logging
import os

import azure.functions as func

from modules.errors.custom_errors import LLMSpecificError
from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.supposed_question import SupposedQuestionPostRequest
from system.assumequestion import get_assumequestion_message


class SupposedQuestionService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        container_name = os.environ.get("AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME")
        if not container_name:
            raise ValueError(
                "AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME environment variable is required"
            )
        self.blob_storage = BlobStorageService(container_name=container_name)

    def form_parser(self) -> SupposedQuestionPostRequest:
        # JSONボディから取得
        try:
            body = self.request.get_json()
        except ValueError:
            logging.error("Invalid JSON in request body")
            raise ValueError("入力が不正です")

        # フォームデータの取得
        description = body.get("description")  # 目的
        consideration = body.get("consideration")  # 考慮事項
        specialty = int(body.get("specialty", 50))  # 専門性
        interest = int(body.get("interest", 50))  # 興味
        intimacy = int(body.get("intimacy", 50))  # 親密度

        params = SupposedQuestionPostRequest(
            description=description,
            consideration=consideration,
            specialty=specialty,
            interest=interest,
            intimacy=intimacy,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        """
        ファイルパスのリストを受け取り、Blob Storageからファイルを読み込んで処理
        """
        # リクエストボディからfileパスを取得
        try:
            body = self.request.get_json()
        except ValueError:
            logging.error("Invalid JSON in request body")
            raise ValueError("入力が不正です")

        file_list = body.get("file", [])
        if not file_list:
            logging.error("files are required")
            raise ValueError("入力が不正です")

        logging.info(f"Received file_list: {file_list}")

        temp_file = ""
        for file_ref in file_list:
            file_path = file_ref.get("name")
            if not file_path:
                continue

            logging.info(f"Processing file from path: {file_path}")

            try:
                # Blob Storageからファイルを読み込む
                file_stream = self.blob_storage.download_file(file_path)

                # ファイル名と拡張子を取得
                extension = file_path.split(".")[-1].lower()
                file_name = file_path.split("/")[-1]

                # ファイルコンテンツを解析
                content_text = get_file_content(file_stream, extension)

                logging.info(
                    f"File - Name: {file_name}, Path: {file_path}, Extension: {extension}"
                )
                temp_file += f"{content_text}\n"
            except LLMSpecificError:
                # LLMSpecificErrorはそのまま再raise（暗号化エラーなど）
                raise
            except Exception as e:
                logging.error(
                    f"Failed to process file - Path: {file_path}, Error: {str(e)}",
                    exc_info=True,
                )
                raise

        if not temp_file:
            logging.error("提案書が提供されていません")
            raise ValueError("提案書が提供されていません")

        return temp_file

    def post_supposed_question(self):
        description = self.form_parser().description
        consideration = self.form_parser().consideration or ""
        specialty = self.form_parser().specialty
        interest = self.form_parser().interest
        intimacy = self.form_parser().intimacy
        temp_file = self.file_parser()

        answer = self.repository.create_aoai_answer(
            get_assumequestion_message(
                description,
                consideration,
                specialty,
                interest,
                intimacy,
                temp_file,
            )
        )
        # レスポンスデータの作成
        response_data = {
            "temp_file": temp_file,
            "content": answer,
            "success": True,
        }

        return response_data

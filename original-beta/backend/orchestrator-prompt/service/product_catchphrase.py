import json
import logging
import os

import azure.functions as func

from modules.errors.custom_errors import LLMSpecificError
from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.catchphrase import (
    CatchphraseFileRequest,
    CatchphrasePostRequest,
    FileReference,
)
from system.catchphrase import get_catchphrase_file_message, get_catchphrase_message


class ProductCatchphraseService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        # Blob Storage サービスの初期化
        container_name = os.environ.get("AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME")
        if container_name:
            self.blob_storage = BlobStorageService(container_name=container_name)
        else:
            self.blob_storage = None

    def form_parser(self) -> CatchphrasePostRequest:
        form = self.request.form

        if form is None:
            logging.error("Form data is required")
            raise ValueError("入力が不正です")

        product_name = form.get("productName")
        product_information = form.get("productInformation")
        target_customer = form.get("targetCustomer")
        competitor = form.get("competitor")
        consideration = form.get("consideration", "")

        if not product_name:
            raise ValueError("製品名は必須です")
        if not product_information:
            raise ValueError("製品情報は必須です")
        if not target_customer:
            raise ValueError("ターゲット顧客は必須です")
        if not competitor:
            raise ValueError("競合との比較は必須です")

        params = CatchphrasePostRequest(
            productName=product_name,
            productInformation=product_information,
            targetCustomer=target_customer,
            Competitor=competitor,
            Consideration=consideration,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        """
        ファイル参照のリストを受け取り、Blob Storageからファイルを読み込んで処理
        """
        form = self.request.form

        if form is None:
            logging.error("Form data is required")
            raise ValueError("入力が不正です")

        file_list_json = form.get("fileList")
        if not file_list_json:
            logging.error("fileList is required")
            raise ValueError("fileListは必須です")

        # JSON パースと Pydantic バリデーション
        try:
            file_list_raw = (
                json.loads(file_list_json)
                if isinstance(file_list_json, str)
                else file_list_json
            )
            file_list = [FileReference(**file_ref) for file_ref in file_list_raw]
        except (json.JSONDecodeError, Exception) as e:
            logging.error(f"Failed to parse fileList: {e}")
            raise ValueError(f"fileListの形式が不正です: {e}")

        logging.info(f"Received file_list: {file_list}")

        if not self.blob_storage:
            logging.error("Blob Storage service is not initialized")
            raise ValueError("Blob Storage設定が不正です")

        original_text = ""
        for file_ref in file_list:
            file_path = file_ref.name

            try:
                logging.info(f"Downloading file: {file_path}")
                file_stream = self.blob_storage.download_file(file_path)

                extension = file_path.split(".")[-1].lower()
                file_name = file_path.split("/")[-1]

                content_text = get_file_content(file_stream, extension)
                logging.info(f"Processed file: {file_name}")
                original_text += f"## {file_name}\n{content_text}\n"

            except LLMSpecificError:
                # LLMSpecificErrorはそのまま再raise（暗号化エラーなど）
                raise
            except Exception as e:
                logging.error(
                    f"Failed to process file - Path: {file_path}, Error: {str(e)}",
                    exc_info=True,
                )
                raise

        return original_text

    def post_product_catchphrase(self):
        form = self.request.form

        # fileList が FormData に含まれているかチェック
        file_list_json = form.get("fileList") if form else None

        if file_list_json:
            # ファイルアップロードモード（Blob Storage参照）
            consideration = form.get("fileConsideration", "") if form else ""

            try:
                file_list_raw = (
                    json.loads(file_list_json)
                    if isinstance(file_list_json, str)
                    else file_list_json
                )
                file_list = [FileReference(**file_ref) for file_ref in file_list_raw]

                params = CatchphraseFileRequest(
                    fileList=file_list,
                    Consideration=consideration or "",
                )
            except (json.JSONDecodeError, Exception) as e:
                logging.error(f"Failed to parse fileList: {e}")
                raise ValueError(f"fileListの形式が不正です: {e}")

            files_content = self.file_parser()
            # ファイル内容を「製品情報」としてプロンプトに埋め込む
            prompt_message = get_catchphrase_file_message(
                files_content, params.Consideration or ""
            )
        else:
            # フォーム入力モード
            params = self.form_parser()
            prompt_message = get_catchphrase_message(
                params.productName,
                params.productInformation,
                params.targetCustomer,
                params.Competitor,
                params.Consideration or "",
            )

        answer = self.repository.create_aoai_answer(prompt_message)
        response_data = {"answer": answer, "success": True}
        return response_data

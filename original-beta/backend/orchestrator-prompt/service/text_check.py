import json
import logging
import os
import re

import azure.functions as func

from modules.errors.custom_errors import LLMSpecificError
from modules.file import FileModule
from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.text_check import FileReference, TextCheckPostRequest
from system.text_check import get_text_check_message


class TextCheckService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        # BlobStorageServiceの初期化
        self.blob_storage = BlobStorageService(
            container_name=os.environ.get("AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME")
        )

    def form_parser(self) -> TextCheckPostRequest:
        form = self.request.form

        text_input = form.get("textInput")
        check_content1 = form.get("checkContent1")
        check_content2 = form.get("checkContent2", "")
        check_content3 = form.get("checkContent3", "")

        params = TextCheckPostRequest(
            textInput=text_input,
            checkContent1=check_content1,
            checkContent2=check_content2,
            checkContent3=check_content3,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        original_text = ""
        form = self.request.form
        text_input = form.get("textInput") if form else None

        # fileListの存在チェック（JSON形式）
        file_list_json = form.get("fileList") if form else None

        if file_list_json:
            # JSON形式のfileListを処理（Blob Storageからファイルを取得）
            try:
                file_list_raw = (
                    json.loads(file_list_json)
                    if isinstance(file_list_json, str)
                    else file_list_json
                )
                file_list = [FileReference(**file_ref) for file_ref in file_list_raw]
                logging.info(f"Received file_list (JSON): {file_list}")

                # Blob Storageからファイルを読み込み
                for file_ref in file_list:
                    file_path = file_ref.name

                    try:
                        logging.info(f"Downloading file from Blob Storage: {file_path}")
                        file_bytes = self.blob_storage.download_file(file_path)

                        extension = file_path.split(".")[-1].lower()
                        file_name = file_path.split("/")[-1]

                        content_text = get_file_content(file_bytes, extension)
                        logging.info(f"Processed file: {file_name}")
                        original_text += f"{content_text}\n"

                    except LLMSpecificError:
                        # LLMSpecificErrorはそのまま再raise（暗号化エラーなど）
                        raise
                    except Exception as e:
                        logging.error(
                            f"Failed to process file - Path: {file_path}, Error: {str(e)}",
                            exc_info=True,
                        )
                        raise

            except (json.JSONDecodeError, ValueError) as e:
                logging.error(f"Failed to parse fileList: {e}")
                raise ValueError(f"fileListの形式が不正です: {e}")

        # 従来のFileList形式の処理（後方互換性のため維持）
        elif self.request.files:
            files = self.request.files
            file_list = files.getlist("fileList")
            logging.info(f"Received file_list (Files): {file_list}")

            for file in file_list:
                name, content_text, extension = FileModule(file).content()
                logging.info(
                    f"File - Name: {name}, Content: {content_text}, Extension: {extension}"
                )
                original_text += f"{content_text}\n"

        # 直接テキスト入力の場合
        elif text_input:
            original_text = text_input
            logging.info(f"Received text: {original_text}")
        else:
            logging.error("Neither fileList nor textInput provided")
            raise ValueError("ファイルまたはテキストは必須です")

        # 制御文字のうち、\n（改行）と\t（タブ）は許可し、それ以外を除去
        original_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", original_text)

        return original_text

    def post_text_check(self):
        original_text = self.file_parser()
        check_content1 = self.form_parser().checkContent1
        check_content2 = self.form_parser().checkContent2
        check_content3 = self.form_parser().checkContent3

        prompt_message = get_text_check_message(
            original_text, check_content1, check_content2, check_content3
        )

        evaluation, corrected_text = self.repository.parse_aoai_answer_text_check(
            prompt_message
        )

        response_data = {
            "evaluation": evaluation,
            "correctedText": corrected_text,
            "success": True,
        }

        return response_data

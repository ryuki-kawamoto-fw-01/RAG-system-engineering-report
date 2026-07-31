import json
import logging
import os
import re

import azure.functions as func
from pydantic import ValidationError

from modules.file_prompt import get_file_content
from modules.textcorrection import (
    convert_term_into_uniform_name,
    judge_check_points,
    judge_document_type,
)
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.text_correction import FileReference, TextCorrectionPostRequest
from system.text_correction import get_text_correction_message


class TextCorrectionService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        self.blob_storage = BlobStorageService(
            container_name=os.environ["AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME"]
        )

    def form_parser(self) -> TextCorrectionPostRequest:
        form = self.request.form

        # フォームデータの取得
        documentType = form.get("documentType")
        checkpoints = form.get("checkpoints")
        text = form.get("text")
        additionalConsiderations = form.get("additionalConsiderations")

        params = TextCorrectionPostRequest(
            documentType=documentType,
            checkpoints=checkpoints,
            text=text,
            additionalConsiderations=additionalConsiderations,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        """
        ファイルパスのリストを受け取り、Blob Storageからファイルを読み込んで処理
        """
        original_text = ""
        form = self.request.form
        text = form.get("text")
        file_list_json = form.get("fileList")

        if file_list_json:
            try:
                file_list_raw = json.loads(file_list_json)
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse fileList JSON: {e}")
                raise ValueError("fileListの形式が不正です")

            # Pydanticでバリデーション
            try:
                file_list = [FileReference(**file_ref) for file_ref in file_list_raw]
            except ValidationError as e:
                logging.error(f"FileReference validation failed: {e}")
                raise ValueError(f"fileListの形式が不正です: {e}")

            logging.info(f"Received file_list: {file_list}")

            for file_ref in file_list:
                file_path = file_ref.name
                file_type = file_ref.type

                try:
                    file_stream = self.blob_storage.download_file(file_path)
                    extension = file_path.split(".")[-1].lower()
                    file_name = file_path.split("/")[-1]
                    content_text = get_file_content(file_stream, extension)

                    logging.info(
                        f"File - Name: {file_name}, Path: {file_path}, Extension: {extension}"
                    )
                    original_text += f"{content_text}\n"
                except Exception as e:
                    logging.error(
                        f"Failed to process file - Path: {file_path}, Type: {file_type}, Error: {str(e)}",
                        exc_info=True,
                    )
                    # LLMSpecificError はそのまま再送出して上位でハンドリング
                    raise
        elif text:
            original_text = text
            logging.info(f"Received text: {original_text}")
        else:
            logging.error("text or fileList is required")
            raise ValueError("textまたはfileListは必須です")

        # 制御文字のうち、\n（改行）と\t（タブ）は許可し、それ以外を除去
        original_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", original_text)

        return original_text

    def post_text_correction(self):
        original_text = self.file_parser()
        documentType = judge_document_type(self.form_parser().documentType)
        check_points = judge_check_points(self.form_parser().checkpoints)
        additional_considerations = self.form_parser().additionalConsiderations

        corrected_text, points_of_criticism = (
            self.repository.parse_aoai_answer_text_correction(
                get_text_correction_message(
                    documentType,
                    check_points,
                    additional_considerations,
                    (
                        convert_term_into_uniform_name(original_text)
                        if "表記ゆれ" in check_points
                        else original_text
                    ),
                )
            )
        )

        response_data = {
            # 指摘事項
            "points_of_criticism": points_of_criticism,
            # 校正前文章
            "original_text": original_text,
            # 校正後文章
            "corrected_text": corrected_text,
            # 成功フラグ
            "success": True,
        }

        return response_data

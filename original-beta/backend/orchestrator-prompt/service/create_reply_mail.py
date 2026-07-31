import json
import logging
import os

import azure.functions as func
from pydantic import ValidationError

from modules.errors.custom_errors import LLMSpecificError
from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.mail import CreateReplyMailPostRequest, FileReference
from system.create_reply_mail import get_create_reply_mail_message


class CreateReplyMailService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        self.blob_storage = BlobStorageService(
            container_name=os.environ["AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME"]
        )

    def form_parser(self) -> CreateReplyMailPostRequest:
        form = self.request.form

        replyMailTo: str = form.get("replyMailTo")
        replyMailFrom: str = form.get("replyMailFrom")
        replyMailPurpose: str = form.get("replyMailPurpose")
        replyMailContent: str = form.get("replyMailContent")
        receivedMailText: str = form.get("receivedMailText")
        replyMailConsiderations: str = form.get("replyMailConsiderations")

        params = CreateReplyMailPostRequest(
            replyMailTo=replyMailTo,
            replyMailFrom=replyMailFrom,
            replyMailPurpose=replyMailPurpose,
            replyMailContent=replyMailContent,
            receivedMailText=receivedMailText,
            replyMailConsiderations=replyMailConsiderations,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        form = self.request.form
        received_mail_text = self.form_parser().receivedMailText
        received_mail_files_json = form.get("receivedMailFiles")
        received_mail = ""

        # ファイルパスのJSONがある場合、Blob Storageから読み込む
        if received_mail_files_json:
            try:
                file_list_raw = json.loads(received_mail_files_json)
                file_list = [FileReference(**file_ref) for file_ref in file_list_raw]
            except (json.JSONDecodeError, ValidationError) as e:
                logging.error(f"Failed to parse receivedMailFiles: {e}")
                raise ValueError("receivedMailFilesの形式が不正です")

            for file_ref in file_list:
                try:
                    file_stream = self.blob_storage.download_file(file_ref.name)
                    extension = file_ref.name.split(".")[-1].lower()
                    content_text = get_file_content(file_stream, extension)
                    received_mail += f"{content_text}\n"
                except LLMSpecificError:
                    # LLMSpecificErrorはそのまま再raise（暗号化エラーなど）
                    raise
                except Exception as e:
                    logging.error(
                        f"Failed to process file - Path: {file_ref.name}, Error: {str(e)}",
                        exc_info=True,
                    )
                    raise
        elif received_mail_text:
            # 直接入力の場合
            received_mail = received_mail_text

        return received_mail

    def post_create_reply_mail(self):
        reply_mail_to = self.form_parser().replyMailTo
        reply_mail_from = self.form_parser().replyMailFrom
        reply_mail_purpose = self.form_parser().replyMailPurpose
        reply_mail_content = self.form_parser().replyMailContent
        reply_mail_considerations = self.form_parser().replyMailConsiderations
        received_mail = self.file_parser()

        answer = self.repository.create_aoai_answer(
            get_create_reply_mail_message(
                reply_mail_to,
                reply_mail_from,
                reply_mail_purpose,
                reply_mail_content,
                reply_mail_considerations,
                received_mail,
            )
        )

        response_data = {"answer": answer, "temp_file": received_mail, "success": True}

        return response_data

import json
import logging

import azure.functions as func

from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from schema.download_minutes import DownloadMinutesPostRequest
from system.download_minutes import create_download_minutes_system_message


class DownloadMinutesService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> DownloadMinutesPostRequest:
        req_json = self.request.get_json()
        result_minutes = req_json.get("resultMinutes")

        logging.info(f"Received result_minutes: {result_minutes}")

        params = DownloadMinutesPostRequest(result_minutes=result_minutes)
        return params

    def file_parser(self) -> str:
        files = self.request.files
        original_text = ""

        if files is None:
            logging.error("files are required")
            return func.HttpResponse("入力が不正です", status_code=400)

        file_list = files.getlist("fileList")
        logging.info(f"Received file_list: {file_list}")

        for file in file_list:
            name = file.filename
            content = file.read()
            extension = name.split(".")[-1]
            try:
                content_text = get_file_content(content, extension)
            except Exception as e:
                # LLMSpecificErrorはそのまま再送出して上位でハンドリング
                raise
            logging.info(
                f"File - Name: {name}, Content: {content_text}, Extension: {extension}"
            )
            original_text += f"## {name}\n{content_text}\n"

        return original_text

    def post_download_minutes(self):
        result_minutes = self.body_parser().result_minutes
        message = create_download_minutes_system_message(minutes=result_minutes)
        answer = self.repository.get_minutes_template(messages=message)

        return {"answer": answer, "success": True}

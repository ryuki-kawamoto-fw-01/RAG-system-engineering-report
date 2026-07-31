import logging

import azure.functions as func

from modules.file import FileModule
from repository.aoai import AoaiRepository
from system.transcription_handwritten import get_system_message, get_user_message


class TranscriptionHandwrittenService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> None:
        return None

    def file_parser(self) -> str:
        files = self.request.files
        original_text = ""

        if files is None:
            logging.error("files are required")
            return func.HttpResponse("入力が不正です", status_code=400)

        file_list = files.getlist("fileList")
        logging.info(f"Received file_list: {file_list}")

        for file in file_list:
            name, content_text, extension = FileModule(file).content()
            logging.info(
                f"File - Name: {name}, Content: {content_text}, Extension: {extension}"
            )
            original_text += f"## {name}\n{content_text}\n"

        return original_text

    def post_transcription_handwritten(self):
        original_text = self.file_parser()
        logging.info(f"Original Text: {original_text}")

        messages = [
            {"role": "system", "content": get_system_message()},
            {
                "role": "user",
                "content": get_user_message(original_text),
            },
        ]
        logging.info(f"Messages: {messages}")

        answer = self.repository.create_aoai_answer(messages)
        logging.info(f"Answer: {answer}")

        return {"answer": answer, "temp_file": original_text, "success": True}

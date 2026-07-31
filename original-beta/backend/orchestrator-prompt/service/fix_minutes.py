import logging

import azure.functions as func

from modules.file import FileModule
from repository.aoai import AoaiRepository
from schema.create_minutes import FixMinutesPostRequest
from system.fix_minutes import get_system_message, get_user_message


class FixMinutesService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> FixMinutesPostRequest:
        result_minutes = self.request.form.get("resultMinutes")
        revision_prompt = self.request.form.get("revisionPrompt")

        params = FixMinutesPostRequest(
            result_minutes=result_minutes,
            revision_prompt=revision_prompt,
        )
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
            name, content_text, extension = FileModule(file).content()
            logging.info(
                f"File - Name: {name}, Content: {content_text}, Extension: {extension}"
            )
            original_text += f"## {name}\n{content_text}\n"

    def post_fix_minutes(self):
        validated_data = self.body_parser()
        result_minutes = validated_data.result_minutes
        revision_prompt = validated_data.revision_prompt
        original_text = self.file_parser()

        messages = [
            {
                "role": "system",
                "content": get_system_message(original_text, result_minutes),
            },
            {"role": "user", "content": get_user_message(revision_prompt)},
        ]
        logging.info(f"Messages: {messages}")

        answer = self.repository.create_aoai_answer(messages)
        logging.info(f"Answer: {answer}")

        return {"answer": answer, "success": True}

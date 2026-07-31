import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.text_completion import TextCompletionPostRequest
from system.text_completion import get_text_completion_message


class TextCompletionService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> TextCompletionPostRequest:
        req_body = self.request.get_json()
        document_type = req_body.get("documentType")
        text = req_body.get("text")

        params = TextCompletionPostRequest(
            documentType=document_type,
            text=text,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_text_completion(self):
        parsed_data = self.body_parser()

        result = self.repository.create_aoai_answer(
            get_text_completion_message(
                parsed_data.documentType,
                parsed_data.text,
            )
        )

        response_data = {
            "result": result,
            "success": True,
            "log": {
                "type": "text_completion",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "documentType": parsed_data.documentType,
                    "text": parsed_data.text,
                },
                "output": result,
            },
        }

        return response_data

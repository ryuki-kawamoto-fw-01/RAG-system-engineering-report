import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.translate import TranslatePostRequest
from system.translate import get_translate_message


class TranslateService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> TranslatePostRequest:
        req_body = self.request.get_json()
        text = req_body.get("text")
        sourceLanguage = req_body.get("sourceLanguage", "auto")
        targetLanguage = req_body.get("targetLanguage")
        considerations = req_body.get("considerations", "")

        params = TranslatePostRequest(
            text=text,
            sourceLanguage=sourceLanguage,
            targetLanguage=targetLanguage,
            considerations=considerations,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_translate(self):
        text = self.body_parser().text
        source_language = self.body_parser().sourceLanguage
        target_language = self.body_parser().targetLanguage
        considerations = self.body_parser().considerations

        answer = self.repository.create_aoai_answer(
            get_translate_message(
                text, source_language, target_language, considerations
            )
        )

        response_data = {"translatedText": answer}

        return response_data

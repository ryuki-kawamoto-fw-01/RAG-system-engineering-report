import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.prompt import CreatePromptPostRequestBody
from system.create_prompt import get_create_prompt_message


class CreatePromptService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> CreatePromptPostRequestBody:
        req_body = self.request.get_json()
        originalPrompt = req_body.get("originalPrompt")

        params = CreatePromptPostRequestBody(
            originalPrompt=originalPrompt,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_prompt(self):
        original_prompt = self.body_parser().originalPrompt

        answer = self.repository.create_aoai_answer(
            get_create_prompt_message(original_prompt)
        )

        response_data = {"answer": answer}

        return response_data

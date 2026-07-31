import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.code_explanation import CodeExplanationPostRequest
from system.code_explanation import create_code_explanation_system_message


class CodeExplanationService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> CodeExplanationPostRequest:
        req_body = self.request.get_json()
        programming_language = req_body.get("programmingLanguage")
        code = req_body.get("code")

        params = CodeExplanationPostRequest(
            programmingLanguage=programming_language,
            code=code,
        )

        logging.info(f"Request body: {params}")

        return params

    def post_code_explanation(self):
        programming_language = self.body_parser().programmingLanguage
        code = self.body_parser().code

        answer = self.repository.create_aoai_answer_reasoning(
            create_code_explanation_system_message(
                programming_language=programming_language, code=code
            )
        )

        response_data = {"result": answer, "success": True}

        return response_data

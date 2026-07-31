import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.advice_react import AdviceReactPostRequest
from system.advice_react import get_advice_react_message


class CreateAdviceReactService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> AdviceReactPostRequest:
        req_body = self.request.get_json()
        advice_input = req_body.get("adviceInput")

        params = AdviceReactPostRequest(
            adviceInput=advice_input,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_advice_react(self):
        advice_input = self.body_parser().adviceInput

        result = self.repository.create_aoai_answer(
            get_advice_react_message(
                advice_input,
            )
        )

        response_data = {"result": result, "success": True}

        return response_data

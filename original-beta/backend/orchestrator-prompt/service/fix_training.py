import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.technology_training import FixTrainingPostRequest
from system.fix_training import get_fix_training_message


class FixTrainingService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> FixTrainingPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        fix_training_request = req_body.get("fixTrainingRequest")

        params = FixTrainingPostRequest(
            result=result,
            fixTrainingRequest=fix_training_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_fix_training(self):
        result = self.body_parser().result
        fix_training_request = self.body_parser().fixTrainingRequest

        answer = self.repository.create_aoai_answer(
            get_fix_training_message(
                result,
                fix_training_request,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

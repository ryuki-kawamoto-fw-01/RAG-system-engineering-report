import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.advice_consulting import AdviceConsultingPostRequest
from system.advice_consulting import get_advice_consulting_message


class AdviceConsultingService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> AdviceConsultingPostRequest:
        req_body = self.request.get_json()
        role = req_body.get("role")
        constraints = req_body.get("constraints")
        advice_input = req_body.get("adviceInput")

        params = AdviceConsultingPostRequest(
            role=role,
            constraints=constraints,
            adviceInput=advice_input,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_advice_consulting(self):
        parsed_data = self.body_parser()
        role = parsed_data.role
        constraints = parsed_data.constraints
        advice_input = parsed_data.adviceInput

        result = self.repository.create_aoai_answer(
            get_advice_consulting_message(
                role,
                constraints,
                advice_input,
            )
        )

        response_data = {"result": result, "success": True}

        return response_data

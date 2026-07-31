import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.judge_idea import JudgeIdeaPostRequest
from system.judge_idea import get_judge_idea_message


class JudgeIdeaService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> JudgeIdeaPostRequest:
        req_body = self.request.get_json()
        ideation_function = req_body.get("ideationFunction")
        ideation_use = req_body.get("ideationUse")
        ideation_market = req_body.get("ideationMarket")
        ideation_country = req_body.get("ideationCountry")

        params = JudgeIdeaPostRequest(
            ideationFunction=ideation_function,
            ideationUse=ideation_use,
            ideationMarket=ideation_market,
            ideationCountry=ideation_country,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_judge_idea(self):
        ideation_function = self.body_parser().ideationFunction
        ideation_use = self.body_parser().ideationUse
        ideation_market = self.body_parser().ideationMarket
        ideation_country = self.body_parser().ideationCountry

        answer = self.repository.create_aoai_answer(
            get_judge_idea_message(
                ideation_function,
                ideation_use,
                ideation_market,
                ideation_country,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

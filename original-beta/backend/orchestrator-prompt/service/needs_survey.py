import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.needs_survey import NeedsSurveyServicePostRequest
from system.needs_survey import get_needs_survey_message


class NeedsSurveyService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> NeedsSurveyServicePostRequest:
        req_body = self.request.get_json()
        industry = req_body.get("industry")
        purpose = req_body.get("purpose")
        product = req_body.get("product")
        persona = req_body.get("persona")
        additionalConsiderations = req_body.get("additionalConsiderations")

        params = NeedsSurveyServicePostRequest(
            industry=industry,
            purpose=purpose,
            product=product,
            persona=persona,
            additionalConsiderations=additionalConsiderations,
        )
        logging.info(f"Request body: {params}")

        return params

    def post_needs_survey(self):
        industry = self.body_parser().industry
        purpose = self.body_parser().purpose
        product = self.body_parser().product
        persona = self.body_parser().persona
        additionalConsiderations = self.body_parser().additionalConsiderations

        answer = self.repository.create_aoai_answer_reasoning(
            get_needs_survey_message(
                industry=industry,
                purpose=purpose,
                product=product,
                persona=persona,
                additionalConsiderations=additionalConsiderations,
            )
        )

        response_data = {
            "answer": answer,
            "log": {
                "type": "idea",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "industry": industry,
                    "purpose": purpose,
                    "product": product,
                    "persona": persona,
                    "additionalConsiderations": additionalConsiderations,
                },
                "output": answer,
            },
        }

        return response_data

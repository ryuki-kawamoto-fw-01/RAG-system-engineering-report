import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.survey_creation import SurveyCreationPostRequest
from system.survey_creation import get_survey_creation_message


class SurveyCreationService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> SurveyCreationPostRequest:
        req_body = self.request.get_json()
        survey_purpose = req_body.get("surveyPurpose")
        target_audience = req_body.get("targetAudience")
        question_count = req_body.get("questionCount")
        response_method = req_body.get("responseMethod")

        params = SurveyCreationPostRequest(
            surveyPurpose=survey_purpose,
            targetAudience=target_audience,
            questionCount=question_count,
            responseMethod=response_method,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_survey_creation(self):
        parsed_data = self.body_parser()

        result = self.repository.create_aoai_answer(
            get_survey_creation_message(
                parsed_data.surveyPurpose,
                parsed_data.targetAudience,
                parsed_data.questionCount,
                parsed_data.responseMethod,
            )
        )

        response_data = {
            "result": result,
            "success": True,
            "log": {
                "type": "survey_creation",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "surveyPurpose": parsed_data.surveyPurpose,
                    "targetAudience": parsed_data.targetAudience,
                    "questionCount": parsed_data.questionCount,
                    "responseMethod": parsed_data.responseMethod,
                },
                "output": result,
            },
        }

        return response_data

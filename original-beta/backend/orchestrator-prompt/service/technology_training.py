import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.technology_training import TechnologyTrainingPostRequest
from system.technology_training import get_technology_training_message


class TechnologyTrainingService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> TechnologyTrainingPostRequest:
        req_body = self.request.get_json()
        technology = req_body.get("technology")
        learning_level = req_body.get("learningLevel")
        study_time = int(req_body.get("studyTime"))
        consideration = req_body.get("consideration", "")

        params = TechnologyTrainingPostRequest(
            technology=technology,
            learningLevel=learning_level,
            studyTime=study_time,
            consideration=consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_technology_training(self):
        technology = self.body_parser().technology
        learning_level = self.body_parser().learningLevel
        study_time = self.body_parser().studyTime
        consideration = self.body_parser().consideration

        answer = self.repository.create_aoai_answer(
            get_technology_training_message(
                technology,
                learning_level,
                study_time,
                consideration,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

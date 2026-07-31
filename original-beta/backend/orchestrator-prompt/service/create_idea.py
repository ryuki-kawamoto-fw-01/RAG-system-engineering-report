import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.idea import IdeaPostRequest
from system.idea import get_idea_message


class CreateIdeaService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> IdeaPostRequest:
        req_body = self.request.get_json()
        ideation_subject = req_body.get("ideationSubject")
        ideation_role = req_body.get("ideationRole")
        ideation_count = int(req_body.get("ideationCount"))
        ideation_consideration = req_body.get("ideationConsideration", "")

        params = IdeaPostRequest(
            ideationSubject=ideation_subject,
            ideationRole=ideation_role,
            ideationCount=ideation_count,
            ideationConsideration=ideation_consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_idea(self):
        ideation_subject = self.body_parser().ideationSubject
        ideation_role = self.body_parser().ideationRole
        ideation_count = self.body_parser().ideationCount
        ideation_consideration = self.body_parser().ideationConsideration

        answer = self.repository.create_aoai_answer_reasoning(
            get_idea_message(
                ideation_subject,
                ideation_role,
                ideation_count,
                ideation_consideration,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

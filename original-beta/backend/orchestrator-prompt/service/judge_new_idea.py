import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.judge_idea import JudgeNewIdeaPostRequest
from system.judge_new_idea import get_judge_new_idea_message


class JudgeNewIdeaService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> JudgeNewIdeaPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_idea_request = req_body.get("newJudgeRequest")

        params = JudgeNewIdeaPostRequest(
            result=result,
            newJudgeRequest=new_idea_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_judge_new_idea(self):
        result = self.body_parser().result
        new_idea_request = self.body_parser().newJudgeRequest

        answer = self.repository.create_aoai_answer(
            get_judge_new_idea_message(
                result,
                new_idea_request,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

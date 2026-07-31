import logging
import datetime

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.brainstorming import NewBrainstormingPostRequest
from system.new_brainstorming import get_new_brainstorming_message


class NewBrainstormingService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> NewBrainstormingPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_idea_request = req_body.get("newIdeaRequest")

        params = NewBrainstormingPostRequest(
            result=result,
            newIdeaRequest=new_idea_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_new_brainstorming(self):
        params = self.body_parser()
        result = params.result
        new_idea_request = params.newIdeaRequest

        answer = self.repository.create_aoai_answer_reasoning(
            get_new_brainstorming_message(
                result,
                new_idea_request,
            )
        )

        response_data = {
            "answer": answer,
            "log": {
                "type": "new_idea",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "result": result,
                    "newIdeaRequest": new_idea_request
                },
                "output": answer
            }
        }

        return response_data

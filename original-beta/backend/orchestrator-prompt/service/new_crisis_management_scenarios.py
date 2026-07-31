import logging
import datetime

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.crisis_management_scenarios import NewCrisisManagementScenariosServicePostRequest
from system.new_crisis_management_scenarios import get_new_crisis_management_scenarios_message


class NewCrisisManagementScenariosService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> NewCrisisManagementScenariosServicePostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_idea_request = req_body.get("newIdeaRequest")

        params = NewCrisisManagementScenariosServicePostRequest(
            result=result,
            newIdeaRequest=new_idea_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_new_crisis_management_scenarios(self):
        params = self.body_parser()
        result = params.result
        new_idea_request = params.newIdeaRequest

        answer = self.repository.create_aoai_answer_reasoning(
            get_new_crisis_management_scenarios_message(
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

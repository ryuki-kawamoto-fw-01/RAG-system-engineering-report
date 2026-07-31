import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.brainstorming import BrainstormingPostRequest
from system.brainstorming import get_brainstorming_message


class BrainstormingService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> BrainstormingPostRequest:
        req_body = self.request.get_json()
        theme = req_body.get("theme")
        expert1 = req_body.get("expert1")
        expert2 = req_body.get("expert2")

        params = BrainstormingPostRequest(
            theme=theme,
            expert1=expert1,
            expert2=expert2,
        )
        logging.info(f"Request body: {params}")

        return params

    def post_brainstorming(self):
        theme = self.body_parser().theme
        expert1 = self.body_parser().expert1
        expert2 = self.body_parser().expert2

        answer = self.repository.create_aoai_answer_reasoning(
            get_brainstorming_message(
                theme=theme,
                expert1=expert1,
                expert2=expert2,
            )
        )

        response_data = {
            "answer": answer,
            "log": {
                "type": "idea",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "theme": theme,
                    "expert1": expert1,
                    "expert2": expert2,
                },
                "output": answer,
            },
        }

        return response_data

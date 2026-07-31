import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.design_document import CreateNewDesignDocumentPostRequest
from system.design_new_document import get_design_new_document_message


class CreateNewDesignDocumentService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> CreateNewDesignDocumentPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_idea_request = req_body.get("newIdeaRequest")

        params = CreateNewDesignDocumentPostRequest(
            result=result,
            newIdeaRequest=new_idea_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_new_design_document(self):
        params = self.body_parser()
        result = params.result
        new_idea_request = params.newIdeaRequest

        answer = self.repository.create_aoai_answer_reasoning(
            get_design_new_document_message(
                result,
                new_idea_request,
            )
        )

        response_data = {
            "answer": answer,
            "log": {
                "type": "new_idea",
                "timestamp": str(datetime.datetime.now()),
                "input": {"result": result, "newIdeaRequest": new_idea_request},
                "output": answer,
            },
        }

        return response_data

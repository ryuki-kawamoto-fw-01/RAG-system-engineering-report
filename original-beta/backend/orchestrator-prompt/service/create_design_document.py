import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.design_document import CreateDesignDocumentPostRequest
from system.design_document import get_design_document_message


class CreateDesignDocumentService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> CreateDesignDocumentPostRequest:
        req_body = self.request.get_json()
        product = req_body.get("product")
        purpose = req_body.get("purpose")
        feature = req_body.get("feature")
        considerations = req_body.get("additionalConsiderations")

        params = CreateDesignDocumentPostRequest(
            product=product,
            purpose=purpose,
            feature=feature,
            considerations=considerations,
        )
        logging.info(f"Request body: {params}")

        return params

    def post_create_design_document(self):
        product = self.body_parser().product
        purpose = self.body_parser().purpose
        feature = self.body_parser().feature
        considerations = self.body_parser().considerations

        answer = self.repository.create_aoai_answer_reasoning(
            get_design_document_message(
                product=product,
                purpose=purpose,
                feature=feature,
                considerations=considerations,
            )
        )

        response_data = {
            "answer": answer,
            "log": {
                "type": "idea",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "product": product,
                    "purpose": purpose,
                    "feature": feature,
                    "considerations": considerations,
                },
                "output": answer,
            },
        }

        return response_data

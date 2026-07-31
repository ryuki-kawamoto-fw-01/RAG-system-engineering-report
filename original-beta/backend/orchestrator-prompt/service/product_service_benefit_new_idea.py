import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_service_benefit_idea import ProductServiceBenefitNewIdeaPostRequest
from system.product_service_benefit_new_idea import (
    get_product_service_benefit_new_idea_message,
)


class ProductServiceBenefitNewIdeaService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductServiceBenefitNewIdeaPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_idea_request = req_body.get("newIdeaRequest")

        params = ProductServiceBenefitNewIdeaPostRequest(
            result=result,
            newIdeaRequest=new_idea_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_new_idea(self):
        result = self.body_parser().result
        new_idea_request = self.body_parser().newIdeaRequest

        answer = self.repository.create_aoai_answer_reasoning(
            get_product_service_benefit_new_idea_message(
                result,
                new_idea_request,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

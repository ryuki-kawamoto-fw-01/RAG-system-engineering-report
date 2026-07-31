import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_service_benefit_idea import ProductServiceBenefitIdeaPostRequest
from system.product_service_benefit_idea import get_product_service_benefit_idea_message


class ProductServiceBenefitIdeaService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductServiceBenefitIdeaPostRequest:
        req_body = self.request.get_json()
        product = req_body.get("Product")
        features = req_body.get("Features")
        consideration = req_body.get("Consideration", "")

        params = ProductServiceBenefitIdeaPostRequest(
            product=product,
            features=features,
            consideration=consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_idea(self):
        product = self.body_parser().product
        features = self.body_parser().features
        consideration = self.body_parser().consideration

        answer = self.repository.create_aoai_answer_reasoning(
            get_product_service_benefit_idea_message(
                product,
                features,
                consideration,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_aarrr import ProductAarrrPostRequest
from system.product_aarrr import get_product_aarrr_message


class ProductAarrrService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductAarrrPostRequest:
        req_body = self.request.get_json()
        product_service = req_body.get("product_service")
        product_service_content = req_body.get("product_service_content")
        additional_considerations = req_body.get("additionalConsiderations", "")

        params = ProductAarrrPostRequest(
            product_service=product_service,
            product_service_content=product_service_content,
            additionalConsiderations=additional_considerations,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_product_aarrr(self):
        product_service = self.body_parser().product_service
        product_service_content = self.body_parser().product_service_content
        additional_considerations = self.body_parser().additionalConsiderations

        answer = self.repository.create_aoai_answer(
            get_product_aarrr_message(
                product_service,
                product_service_content,
                additional_considerations,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

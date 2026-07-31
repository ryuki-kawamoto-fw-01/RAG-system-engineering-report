import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_name import ProductNamePostRequest
from system.productname import get_productname_message


class CreateProductNameService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductNamePostRequest:
        req_body = self.request.get_json()
        productname_subject = req_body.get("productnameSubject")
        productname_role = req_body.get("productnameRole")
        productname_convention = req_body.get("productnameConvention")

        params = ProductNamePostRequest(
            productnameSubject=productname_subject,
            productnameRole=productname_role,
            productnameConvention=productname_convention,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_productname(self):
        productname_subject = self.body_parser().productnameSubject
        productname_role = self.body_parser().productnameRole
        productname_convention = self.body_parser().productnameConvention

        answer = self.repository.create_aoai_answer(
            get_productname_message(
                productname_subject,
                productname_role,
                productname_convention,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

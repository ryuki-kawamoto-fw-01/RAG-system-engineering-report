import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_name import ProductNameNewPostRequest
from system.new_productname import get_new_productname_message


class CreateNewProductnameService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductNameNewPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_productname_request = req_body.get("newproductnameRequest")

        params = ProductNameNewPostRequest(
            result=result,
            newproductnameRequest=new_productname_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_new_productname(self):
        result = self.body_parser().result
        new_productname_request = self.body_parser().newproductnameRequest

        answer = self.repository.create_aoai_answer(
            get_new_productname_message(
                result,
                new_productname_request,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

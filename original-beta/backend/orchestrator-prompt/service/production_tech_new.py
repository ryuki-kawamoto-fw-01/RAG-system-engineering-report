import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.production_tech import ProductionTechNewPostRequest
from system.production_tech_new import get_new_production_tech_message


class CreateNewProductionTechService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductionTechNewPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_production_tech_request = req_body.get("newProductionTechRequest")

        params = ProductionTechNewPostRequest(
            result=result,
            newProductionTechRequest=new_production_tech_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_new_production_tech(self):
        params = self.body_parser()
        result = params.result
        new_production_tech_request = params.newProductionTechRequest

        answer = self.repository.create_aoai_answer_reasoning(
            get_new_production_tech_message(
                result,
                new_production_tech_request,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

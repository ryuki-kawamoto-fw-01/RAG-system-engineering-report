import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.business_plan import BusinessPlanNewPostRequest
from system.business_plan_new import get_new_business_plan_message


class CreateNewBusinessPlanService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> BusinessPlanNewPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_business_plan_request = req_body.get("newBusinessPlanRequest")

        params = BusinessPlanNewPostRequest(
            result=result,
            newBusinessPlanRequest=new_business_plan_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_new_business_plan(self):
        params = self.body_parser()
        result = params.result
        new_business_plan_request = params.newBusinessPlanRequest

        answer = self.repository.create_aoai_answer_reasoning(
            get_new_business_plan_message(
                result,
                new_business_plan_request,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.company_analysis import CompanyReanalysisPostRequest
from system.reanalysis import get_reanalysis_message


class CompanyReanalysisService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> CompanyReanalysisPostRequest:
        req_body = self.request.get_json()
        analytical_methods = req_body.get("analytical_methods")
        existing_analysis = req_body.get("existing_analysis")
        reanalysis_request = req_body.get("reanalysis_request")

        params = CompanyReanalysisPostRequest(
            analytical_methods=analytical_methods,
            existing_analysis=existing_analysis,
            reanalysis_request=reanalysis_request,
        )
        logging.info(f"Request body: {params}")

        return params

    def post_company_reanalysis(self):
        analytical_methods = self.body_parser().analytical_methods
        existing_analysis = self.body_parser().existing_analysis
        reanalysis_request = self.body_parser().reanalysis_request

        answers = [
            self.repository.create_aoai_answer_reasoning(
                get_reanalysis_message(existing_analysis, method, reanalysis_request)
            )
            for method in analytical_methods
        ]

        answer_text = "\n\n".join(answers)
        response_data = {"answer": answer_text}

        return response_data
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.company_analysis import CompanyAnalysisPostRequest
from system.fiveforce import get_fiveforce_message
from system.fourp import get_fourp_message
from system.pest import get_pest_message
from system.swot import get_swot_message
from system.threec import get_threec_message
from system.value_chain import get_value_chain_message


def get_analytical_methods_message(
    analytical_method: str, params: CompanyAnalysisPostRequest
) -> str:
    if analytical_method == "swot":
        messages = get_swot_message(
            params.company_name,
            params.analysis_purpose,
            params.analysis_considerations,
        )
        return messages
    if analytical_method == "fiveforce":
        messages = get_fiveforce_message(
            params.business_name,
            params.company_name,
            params.analysis_purpose,
            params.analysis_considerations,
        )
        return messages
    if analytical_method == "pest":
        messages = get_pest_message(
            params.business_name,
            params.company_name,
            params.analysis_purpose,
            params.analysis_considerations,
        )
        return messages
    if analytical_method == "fourp":
        messages = get_fourp_message(
            params.company_name,
            params.analysis_purpose,
            params.analysis_considerations,
        )
        return messages
    if analytical_method == "threec":
        messages = get_threec_message(
            params.company_name,
            params.analysis_purpose,
            params.analysis_considerations,
        )
        return messages
    if analytical_method == "valueChain":
        messages = get_value_chain_message(
            params.company_name,
            params.analysis_purpose,
            params.analysis_considerations,
        )
        return messages


class CompanyAnalysisService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> CompanyAnalysisPostRequest:
        req_body = self.request.get_json()
        business_name = req_body.get("business_name")
        analytical_methods = req_body.get("analytical_methods")
        company_name = req_body.get("company_name")
        analysis_purpose = req_body.get("analysis_purpose")
        analysis_considerations = req_body.get("analysis_considerations")

        params = CompanyAnalysisPostRequest(
            business_name=business_name,
            analytical_methods=analytical_methods,
            company_name=company_name,
            analysis_purpose=analysis_purpose,
            analysis_considerations=analysis_considerations,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_company_analysis(self):
        analytical_methods = self.body_parser().analytical_methods

        answers = [
            self.repository.create_aoai_answer_reasoning(
                get_analytical_methods_message(method, self.body_parser())
            )
            for method in analytical_methods
        ]

        answer_text = "\n\n".join(answers)
        response_data = {"answer": answer_text}

        return response_data
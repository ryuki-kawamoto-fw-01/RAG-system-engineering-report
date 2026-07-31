import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.research_report import ResearchNewReportPostRequest
from system.research_new_report import get_research_new_report_message


class ResearchNewReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ResearchNewReportPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        new_idea_request = req_body.get("newIdeaRequest")

        params = ResearchNewReportPostRequest(
            result=result,
            newIdeaRequest=new_idea_request,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_research_new_report(self):
        result = self.body_parser().result
        new_idea_request = self.body_parser().newIdeaRequest

        answer = self.repository.create_aoai_answer_reasoning(
            get_research_new_report_message(
                result,
                new_idea_request,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

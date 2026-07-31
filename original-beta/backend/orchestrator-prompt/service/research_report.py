import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.research_report import ResearchReportPostRequest
from system.research_report import get_research_report_message


class ResearchReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ResearchReportPostRequest:
        req_body = self.request.get_json()
        subject = req_body.get("subject")
        purpose = req_body.get("purpose")
        method = req_body.get("method")
        researchresult = req_body.get("researchresult")
        references = req_body.get("references")
        consideration = req_body.get("consideration", "")

        params = ResearchReportPostRequest(
            subject=subject,
            purpose=purpose,
            method=method,
            researchresult=researchresult,
            references=references,
            consideration=consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_research_report(self):
        subject = self.body_parser().subject
        purpose = self.body_parser().purpose
        method = self.body_parser().method
        researchresult = self.body_parser().researchresult
        references = self.body_parser().references
        consideration = self.body_parser().consideration

        answer = self.repository.create_aoai_answer_reasoning(
            get_research_report_message(
                subject,
                purpose,
                method,
                researchresult,
                references,
                consideration,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

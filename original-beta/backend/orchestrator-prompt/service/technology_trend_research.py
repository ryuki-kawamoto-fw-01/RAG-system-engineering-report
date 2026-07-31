import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.technology_trend_research import TechnologyTrendResearchPostRequest
from system.technology_trend_research import get_technology_trend_research_message


class TechnologyTrendResearchService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> TechnologyTrendResearchPostRequest:
        req_body = self.request.get_json()
        technical_field = req_body.get("technicalField")
        time_range = req_body.get("timeRange")
        target_area = req_body.get("targetArea")
        report_format = req_body.get("reportFormat", "")

        params = TechnologyTrendResearchPostRequest(
            technicalField=technical_field,
            timeRange=time_range,
            targetArea=target_area,
            reportFormat=report_format,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_technology_trend_research(self):
        technical_field = self.body_parser().technicalField
        time_range = self.body_parser().timeRange
        target_area = self.body_parser().targetArea
        report_format = self.body_parser().reportFormat

        answer = self.repository.create_aoai_answer_reasoning(
            get_technology_trend_research_message(
                technical_field,
                time_range,
                target_area,
                report_format,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

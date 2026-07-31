import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.market_research import MarketResearchPostRequest
from system.market_research import get_market_research_message


class MarketResearchReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> MarketResearchPostRequest:
        req_body = self.request.get_json()
        logging.info(f"Raw request body: {req_body}") 
        market = req_body.get("market")
        competitor = req_body.get("competitor")
        target_customer = req_body.get("targetCustomer")
        purpose = req_body.get("purpose")
        consideration = req_body.get("consideration", "")

        params = MarketResearchPostRequest(
            market=market,
            competitor=competitor,
            targetCustomer=target_customer,
            purpose=purpose,
            consideration=consideration
        )
        logging.info(f"Request body: {params}")
        return params

    def post_market_research_report(self):
        market = self.body_parser().market
        competitor = self.body_parser().competitor
        target_customer = self.body_parser().targetCustomer
        purpose = self.body_parser().purpose
        consideration = self.body_parser().consideration

        answer = self.repository.create_aoai_answer(
            get_market_research_message(
                market,
                competitor,
                target_customer,
                purpose,
                consideration
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data
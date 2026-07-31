import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.market_research import ReportFixPostRequest
from system.fix_market_report import get_fix_report_message


class FixMarketReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ReportFixPostRequest:
        req_body = self.request.get_json()
        # 1回前の値
        prev_market = req_body.get("prev_market")
        prev_competitor = req_body.get("prev_competitor")
        prev_target = req_body.get("prev_target")
        prev_purpose = req_body.get("prev_purpose")
        prev_consideration = req_body.get("prev_consideration", "")
        # 現状の値
        market = req_body.get("market")
        competitor = req_body.get("competitor")
        target = req_body.get("target")
        purpose = req_body.get("purpose")
        consideration = req_body.get("consideration", "")
        result = req_body.get("result")

        params = ReportFixPostRequest(
            result = result,
            prev_market = prev_market,
            prev_competitor = prev_competitor,
            prev_target = prev_target,
            prev_purpose = prev_purpose,
            prev_consideration = prev_consideration,
            market = market,
            competitor = competitor,
            target = target,
            purpose = purpose,
            consideration = consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_fix_market_report(self):
        result = self.body_parser().result
        params = self.body_parser()
        answer = self.repository.create_aoai_answer(
            get_fix_report_message(
                params.result,
                params.prev_market,
                params.prev_competitor,
                params.prev_target,
                params.prev_purpose,
                params.prev_consideration,
                params.market,
                params.competitor,
                params.target,
                params.purpose,
                params.consideration,
            )
        )
        response_data = {"answer": answer, "success": True}
        return response_data
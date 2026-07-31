import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.term_summary import TermSummaryPostRequest
from system.term_summary import get_term_summary_message


class TermSummaryService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def json_parser(self) -> TermSummaryPostRequest:
        req_body = self.request.get_json()
        logging.info(f"Raw body: {self.request.get_body()}")

        domain = req_body.get("domain")
        content = req_body.get("content")
        consideration = req_body.get("consideration")

        params = TermSummaryPostRequest(
            domain=domain,
            content=content,
            consideration=consideration,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_term_summary(self):
        parsed = self.json_parser()
        logging.info(f"Raw body: {self.json_parser()}")

        term_summary_result, term_explanation = (
            self.repository.parse_aoai_answer_term_summary(
                get_term_summary_message(
                    domain=parsed.domain,
                    content=parsed.content,
                    consideration=parsed.consideration,
                )
            )
        )

        response_data = {
            # 要約結果
            "term_summary_result": term_summary_result,
            # 用語解説
            "term_explanation": term_explanation,
            # 成功フラグ
            "success": True,
        }

        return response_data

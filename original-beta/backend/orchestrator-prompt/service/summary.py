import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.summary import SummaryPostRequest
from system.summary import get_summary_message


class SummaryService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> SummaryPostRequest:
        form = self.request.form

        content: str = form.get("content")
        summary_char: int = int(form.get("summaryLength"))
        add_prompt: str = form.get("consideration")

        params = SummaryPostRequest(
            content=content,
            summaryLength=summary_char,
            consideration=add_prompt,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_summary(self):
        content = self.form_parser().content
        summary_char = self.form_parser().summaryLength
        add_prompt = self.form_parser().consideration

        answer = self.repository.create_aoai_answer_reasoning(
            get_summary_message(
                content,
                summary_char,
                add_prompt,
            )
        )

        response_data = {
            "content": answer,
            "success": True,
        }

        return response_data

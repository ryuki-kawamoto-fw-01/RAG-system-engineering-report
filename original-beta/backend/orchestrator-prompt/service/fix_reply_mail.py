import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.mail import FixReplyMailPostRequest
from system.fix_reply_mail import get_fix_reply_mail_message


class FixReplyMailService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> FixReplyMailPostRequest:
        form = self.request.form

        createdContent: str = form.get("createdContent")
        modify: str = form.get("modify")

        params = FixReplyMailPostRequest(
            createdContent=createdContent,
            modify=modify,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_fix_reply_mail(self):
        created_content = self.form_parser().createdContent
        modify = self.form_parser().modify

        answer = self.repository.create_aoai_answer(
            get_fix_reply_mail_message(
                created_content,
                modify,
            )
        )
        response_data = {"answer": answer, "success": True}

        return response_data

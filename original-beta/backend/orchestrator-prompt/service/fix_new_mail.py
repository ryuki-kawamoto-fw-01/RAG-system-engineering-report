import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.mail import FixNewMailPostRequest
from system.fix_new_mail import get_fix_new_mail_message


class FixNewMailService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> FixNewMailPostRequest:
        form = self.request.form

        createdSubject: str = form.get("createdSubject")
        createdContent: str = form.get("createdContent")
        modify: str = form.get("modify")

        params = FixNewMailPostRequest(
            createdSubject=createdSubject,
            createdContent=createdContent,
            modify=modify,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_fix_new_mail(self):
        created_subject = self.form_parser().createdSubject
        created_content = self.form_parser().createdContent
        modify = self.form_parser().modify

        subject, content = self.repository.parse_aoai_answer_create_mail(
            get_fix_new_mail_message(
                created_subject,
                created_content,
                modify,
            )
        )
        response_data = {
            # 件名
            "subject": subject,
            # 本文
            "content": content,
            # 成功フラグ
            "success": True,
        }

        return response_data

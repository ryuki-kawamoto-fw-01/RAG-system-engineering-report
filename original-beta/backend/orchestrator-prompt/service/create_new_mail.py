import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.mail import CreateNewMailPostRequest
from system.create_new_mail import get_create_new_mail_message


class CreateNewMailService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> CreateNewMailPostRequest:
        form = self.request.form

        newMailTo: str = form.get("newMailTo")
        newMailFrom: str = form.get("newMailFrom")
        newMailPurpose: str = form.get("newMailPurpose")
        newMailContent: str = form.get("newMailContent")
        newMailConsiderations: str = form.get("newMailConsiderations")

        params = CreateNewMailPostRequest(
            newMailTo=newMailTo,
            newMailFrom=newMailFrom,
            newMailPurpose=newMailPurpose,
            newMailContent=newMailContent,
            newMailConsiderations=newMailConsiderations,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_create_new_mail(self):
        new_mail_to = self.form_parser().newMailTo
        new_mail_from = self.form_parser().newMailFrom
        new_mail_purpose = self.form_parser().newMailPurpose
        new_mail_content = self.form_parser().newMailContent
        new_mail_considerations = self.form_parser().newMailConsiderations

        subject, content = self.repository.parse_aoai_answer_create_mail(
            get_create_new_mail_message(
                new_mail_to,
                new_mail_from,
                new_mail_purpose,
                new_mail_content,
                new_mail_considerations,
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

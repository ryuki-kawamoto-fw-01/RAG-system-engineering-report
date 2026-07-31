import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.supposed_question import ModifySupposedQuestionPostRequest
from system.reassumequestion import get_reassumequestion_message


class ModifySupposedQuestionService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> ModifySupposedQuestionPostRequest:
        form = self.request.form

        # フォームデータの取得
        description = form.get("description")
        qa_list = list(form.get("qa_list"))
        temp_file = form.get("temp_file")

        params = ModifySupposedQuestionPostRequest(
            description=description,
            qa_list=qa_list,
            temp_file=temp_file,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_modify_supposed_question(self):
        description = self.form_parser().description
        qa_list = self.form_parser().qa_list
        temp_file = self.form_parser().temp_file

        answer = self.repository.create_aoai_answer(
            get_reassumequestion_message(
                description,
                qa_list,
                temp_file,
            )
        )
        # レスポンスデータの作成
        response_data = {
            "content": answer,
            "success": True,
        }

        return response_data

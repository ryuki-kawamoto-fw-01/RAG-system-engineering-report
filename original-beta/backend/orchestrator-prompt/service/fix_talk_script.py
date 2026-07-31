import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.talk_script import FixTalkScriptPostRequest
from system.fix_talk_script import get_fix_talk_script_message


class FixTalkScriptService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> FixTalkScriptPostRequest:
        form = self.request.form

        # フォームデータの取得
        result = form.get("result")
        modify = form.get("modify")

        params = FixTalkScriptPostRequest(
            result=result,
            modify=modify,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_fix_talk_script(self):
        result = self.form_parser().result
        modify = self.form_parser().modify

        answer = self.repository.create_aoai_answer(
            get_fix_talk_script_message(
                result,
                modify,
            )
        )

        # レスポンスデータの作成
        response_data = {"answer": answer, "success": True}

        return response_data

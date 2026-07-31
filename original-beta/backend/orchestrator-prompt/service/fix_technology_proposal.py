import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.technology_proposal import FixTechnologyProposalPostRequest
from system.fix_technology_proposal import get_fix_technology_proposal_message


class FixTechnologyProposalService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> FixTechnologyProposalPostRequest:
        form = self.request.get_json()

        # フォームデータの取得
        result = form.get("result")
        modify = form.get("modify")

        params = FixTechnologyProposalPostRequest(
            result=result,
            modify=modify,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_fix_technology_proposal(self):
        result = self.form_parser().result
        modify = self.form_parser().modify

        answer = self.repository.create_aoai_answer(
            get_fix_technology_proposal_message(
                result,
                modify,
            )
        )

        # レスポンスデータの作成
        response_data = {"answer": answer, "success": True}

        return response_data

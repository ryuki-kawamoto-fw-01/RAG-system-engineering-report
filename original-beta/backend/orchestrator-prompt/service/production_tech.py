import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.production_tech import ProductionTechPostRequest
from system.production_tech import get_create_production_tech_message


class CreateProductionTechService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductionTechPostRequest:
        req_body = self.request.get_json()
        category = req_body.get("category")
        focus = req_body.get("focus")
        issues = req_body.get("issues")

        params = ProductionTechPostRequest(
            category=category,
            focus=focus,
            issues=issues,
        )
        logging.info(f"Request body: {params}")

        return params

    def post_production_tech(self):
        # リクエストボディからパラメータを取得
        params = self.body_parser()

        # プロンプト生成
        prompt_messages = get_create_production_tech_message(
            category=params.category,
            focus=params.focus,
            issues=params.issues,
        )

        # Azure OpenAIを使用して生産技術の洗い出しを実行
        answer = self.repository.create_aoai_answer(prompt_messages)

        # 返却データをJSONとして返す
        response_data = {"answer": answer}
        return response_data

    def create(self):
        # 後方互換性のために残しておく
        return self.post_production_tech()

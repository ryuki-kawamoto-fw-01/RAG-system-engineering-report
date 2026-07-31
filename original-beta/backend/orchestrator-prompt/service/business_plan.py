import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.business_plan import BusinessPlanPostRequest
from system.business_plan import get_create_business_plan_message


class CreateBusinessPlanService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> BusinessPlanPostRequest:
        req_body = self.request.get_json()
        businessName = req_body.get("businessName")
        businessPurpose = req_body.get("businessPurpose")
        targetMarket = req_body.get("targetMarket")
        businessModel = req_body.get("businessModel")
        competitiveAdvantage = req_body.get("competitiveAdvantage")
        financialProjection = req_body.get("financialProjection")

        params = BusinessPlanPostRequest(
            businessName=businessName,
            businessPurpose=businessPurpose,
            targetMarket=targetMarket,
            businessModel=businessModel,
            competitiveAdvantage=competitiveAdvantage,
            financialProjection=financialProjection,
        )
        logging.info(f"Request body: {params}")

        return params

    def create(self):
        # リクエストボディからパラメータを取得
        params = self.body_parser()

        # プロンプト生成
        prompt_messages = get_create_business_plan_message(
            businessName=params.businessName,
            businessPurpose=params.businessPurpose,
            targetMarket=params.targetMarket,
            businessModel=params.businessModel,
            competitiveAdvantage=params.competitiveAdvantage,
            financialProjection=params.financialProjection,
        )

        # Azure OpenAIを使用して生産技術の洗い出しを実行
        answer = self.repository.create_aoai_answer(prompt_messages)

        # 返却データをJSONとして返す
        response_data = {"answer": answer}
        return response_data

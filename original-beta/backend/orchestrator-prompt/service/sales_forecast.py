import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.sales_forecast import FixSalesForecastRequest, SalesForecastRequest
from system.sales_forecast import get_fix_user_message, get_user_message


# 新規作成
class SalesForecastService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> SalesForecastRequest:
        req_body = self.request.get_json()
        params = SalesForecastRequest(
            productName=req_body.get("productName"),
            productCategory=req_body.get("productCategory", []),
            features=req_body.get("features"),
            useCase=req_body.get("useCase"),
            analysisPriorities=req_body.get("analysisPriorities", []),
            targetIndustry=req_body.get("targetIndustry", []),
            targetCustomers=req_body.get("targetCustomers", []),
            targetRegions=req_body.get("targetRegions", []),
            marketData=req_body.get("marketData"),
            competingProducts=req_body.get("competingProducts"),
        )

        logging.info(f"Request body: {params}")
        return params

    def post_sales_forecast(self):
        p = self.body_parser()
        answer = self.repository.create_aoai_answer_reasoning(
            get_user_message(
                p.productName,
                p.productCategory,
                p.features,
                p.useCase,
                p.analysisPriorities,
                p.targetIndustry,
                p.targetCustomers,
                p.targetRegions,
                p.marketData,
                p.competingProducts,
            )
        )
        response_data = {"answer": answer, "success": True}
        return response_data


# 結果調整
class FixSalesForecastService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> FixSalesForecastRequest:
        req_body = self.request.get_json()
        params = FixSalesForecastRequest(
            result=req_body.get("result"),
            revisionPrompt=req_body.get("revisionPrompt"),
        )

        logging.info(f"Request body: {params}")
        return params

    def post_fix_sales_forecast(self):
        result = self.body_parser().result
        revisionPrompt = self.body_parser().revisionPrompt

        answer = self.repository.create_aoai_answer_reasoning(
            get_fix_user_message(
                result,
                revisionPrompt,
            )
        )

        response_data = {"answer": answer, "success": True}
        return response_data

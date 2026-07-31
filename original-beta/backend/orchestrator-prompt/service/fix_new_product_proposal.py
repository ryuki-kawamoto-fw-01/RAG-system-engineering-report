import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.new_product_proposal import NewProductProposalFixPostRequest
from system.fix_new_product_proposal import \
    get_fix_new_product_proposal_message


class FixNewProductProposalService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> NewProductProposalFixPostRequest:
        req_body = self.request.get_json()
        # 1回前の値
        prev_product_name = req_body.get("prev_product_name")
        prev_product_market = req_body.get("prev_product_market")
        prev_target = req_body.get("prev_target")
        prev_concept = req_body.get("prev_concept")
        prev_comparison_points = req_body.get("prev_comparison_points")
        prev_consideration = req_body.get("prev_consideration", "")
        # 現状の値
        productName = req_body.get("productName")
        productMarket = req_body.get("productMarket")
        targetCustomer = req_body.get("targetCustomer")
        concept = req_body.get("concept")
        comparisonPoints = req_body.get("comparisonPoints")
        consideration = req_body.get("consideration", "")
        result = req_body.get("result")

        params = NewProductProposalFixPostRequest(
            result=result,
            prev_productName=prev_product_name,
            prev_productMarket=prev_product_market,
            prev_targetCustomer=prev_target,
            prev_concept=prev_concept,
            prev_comparisonPoints=prev_comparison_points,
            prev_consideration=prev_consideration,
            productName=productName,
            productMarket=productMarket,
            targetCustomer=targetCustomer,
            concept=concept,
            comparisonPoints=comparisonPoints,
            consideration=consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_fix_new_product_proposal(self):
        # result = self.body_parser().result
        params = self.body_parser()
        answer = self.repository.create_aoai_answer(
            get_fix_new_product_proposal_message(
                params.result,
                params.prev_productName,
                params.prev_productMarket,
                params.prev_targetCustomer,
                params.prev_concept,
                params.prev_comparisonPoints,
                params.prev_consideration,
                params.productName,
                params.productMarket,
                params.targetCustomer,
                params.concept,
                params.comparisonPoints,
                params.consideration,
            )
        )
        response_data = {"answer": answer, "success": True}
        return response_data

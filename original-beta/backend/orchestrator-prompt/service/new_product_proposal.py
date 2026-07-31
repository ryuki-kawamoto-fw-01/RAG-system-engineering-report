import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.new_product_proposal import NewProductProposalPostRequest
from system.new_product_proposal import get_new_product_proposal_message


class NewProductProposalService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> NewProductProposalPostRequest:
        req_body = self.request.get_json()
        logging.info(f"Raw request body: {req_body}")
        productName = req_body.get("productName")
        productMarket = req_body.get("productMarket")
        targetCustomer = req_body.get("targetCustomer")
        concept = req_body.get("concept")
        comparisonPoints = req_body.get("comparisonPoints")
        consideration = req_body.get("consideration", "")

        params = NewProductProposalPostRequest(
            productName=productName,
            productMarket=productMarket,
            targetCustomer=targetCustomer,
            concept=concept,
            comparisonPoints=comparisonPoints,
            consideration=consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_new_product_proposal(self):
        productName = self.body_parser().productName
        productMarket = self.body_parser().productMarket
        targetCustomer = self.body_parser().targetCustomer
        concept = self.body_parser().concept
        comparisonPoints = self.body_parser().comparisonPoints
        consideration = self.body_parser().consideration

        answer = self.repository.create_aoai_answer(
            get_new_product_proposal_message(
                productName,
                productMarket,
                targetCustomer,
                concept,
                comparisonPoints,
                consideration,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

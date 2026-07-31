import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.technology_proposal import TechnologyProposalPostRequest
from system.technology_proposal import get_technologyProposal_message


class CreateTechnologyProposalService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> TechnologyProposalPostRequest:
        req_body = self.request.get_json()
        logging.info(f"Raw request body: {req_body}")

        technologyName = req_body.get("technologyName")
        market = req_body.get("market")
        current_Issues = req_body.get("current_Issues")
        consideration = req_body.get("consideration", "")

        params = TechnologyProposalPostRequest(
            technologyName=technologyName,
            market=market,
            current_Issues=current_Issues,
            consideration=consideration,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_create_technology_proposal(self):
        params = self.body_parser()
        technologyName = params.technologyName
        market = params.market
        current_Issues = params.current_Issues
        consideration = params.consideration

        answer = self.repository.create_aoai_answer(
            get_technologyProposal_message(
                technologyName,
                market,
                current_Issues,
                consideration,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

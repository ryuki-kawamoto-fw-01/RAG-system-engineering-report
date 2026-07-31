import logging
import datetime

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.crisis_management_scenarios import CrisisManagementScenariosServicePostRequest
from system.crisis_management_scenarios import get_crisis_management_scenarios_message


class CrisisManagementScenariosService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> CrisisManagementScenariosServicePostRequest:
        req_body = self.request.get_json()
        industry = req_body.get("industry")
        businessSize = req_body.get("businessSize")
        businessContent = req_body.get("businessContent")
        selectedOptions = req_body.get("selectedOptions")
        additionalContents = req_body.get("additionalContents")
        considerations = req_body.get("additionalConsiderations")

        params = CrisisManagementScenariosServicePostRequest(
            industry=industry,
            businessSize=businessSize,
            businessContent=businessContent,
            selectedOptions=selectedOptions,
            additionalContents=additionalContents,
            considerations=considerations,
        )
        logging.info(f"Request body: {params}")

        return params

    def post_crisis_management_scenarios(self):
        industry = self.body_parser().industry
        businessSize = self.body_parser().businessSize
        businessContent = self.body_parser().businessContent
        selectedOptions = self.body_parser().selectedOptions
        additionalContents = self.body_parser().additionalContents
        considerations = self.body_parser().considerations

        answer = self.repository.create_aoai_answer_reasoning(
            get_crisis_management_scenarios_message(
                industry=industry,
                businessSize=businessSize,
                businessContent=businessContent,
                selectedOptions=selectedOptions,
                additionalContents=additionalContents,
                considerations=considerations,
            )
        )

        response_data = {
            "answer": answer,
            "log": {
                "type": "idea",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "industry": industry,
                    "businessSize": businessSize,
                    "businessContent": businessContent,
                    "selectedOptions": selectedOptions,
                    "additionalContents": additionalContents,
                    "considerations": considerations
                },
                "output": answer
            }
        }

        return response_data

import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.marketing_strategy import MarketingStrategyPostRequest
from system.marketing_strategy import get_marketing_strategy_message


class MarketingStrategyService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> MarketingStrategyPostRequest:
        req_body = self.request.get_json()
        MarketSize = req_body.get("MarketSize")
        GrowthRate = req_body.get("GrowthRate")
        KeyPlayer = req_body.get("KeyPlayer")
        Competitors = req_body.get("Competitors")
        CustomerAttributes = req_body.get("CustomerAttributes")
        PurchasingBehavior = req_body.get("PurchasingBehavior")

        params = MarketingStrategyPostRequest(
            MarketSize=MarketSize,
            GrowthRate=GrowthRate,
            KeyPlayer=KeyPlayer,
            Competitors=Competitors,
            CustomerAttributes=CustomerAttributes,
            PurchasingBehavior=PurchasingBehavior,
        )
        logging.info(f"Request body: {params}")

        return params

    def post_marketing_strategy(self):
        MarketSize = self.body_parser().MarketSize
        GrowthRate = self.body_parser().GrowthRate
        KeyPlayer = self.body_parser().KeyPlayer
        Competitors = self.body_parser().Competitors
        CustomerAttributes = self.body_parser().CustomerAttributes
        PurchasingBehavior = self.body_parser().PurchasingBehavior

        answer = self.repository.create_aoai_answer_reasoning(
            get_marketing_strategy_message(
                MarketSize=MarketSize,
                GrowthRate=GrowthRate,
                KeyPlayer=KeyPlayer,
                Competitors=Competitors,
                CustomerAttributes=CustomerAttributes,
                PurchasingBehavior=PurchasingBehavior,
            )
        )

        response_data = {
            "answer": answer,
            "log": {
                "type": "idea",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "MarketSize": MarketSize,
                    "GrowthRate": GrowthRate,
                    "KeyPlayer": KeyPlayer,
                    "Competitors": Competitors,
                    "CustomerAttributes": CustomerAttributes,
                    "PurchasingBehavior": PurchasingBehavior,
                },
                "output": answer,
            },
        }

        return response_data

import datetime
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_promotion_strategy import ProductPromotionStrategyPostRequest
from system.product_promotion_strategy import get_product_promotion_strategy_message


class ProductPromotionStrategyService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductPromotionStrategyPostRequest:
        req_body = self.request.get_json()
        product_description = req_body.get("productDescription")
        target_market = req_body.get("targetMarket")
        differentiation_point = req_body.get("differentiationPoint")
        promotion_tools = req_body.get("promotionTools")
        sales_channels = req_body.get("salesChannels")

        params = ProductPromotionStrategyPostRequest(
            productDescription=product_description,
            targetMarket=target_market,
            differentiationPoint=differentiation_point,
            promotionTools=promotion_tools,
            salesChannels=sales_channels,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_product_promotion_strategy(self):
        parsed_data = self.body_parser()

        result = self.repository.create_aoai_answer(
            get_product_promotion_strategy_message(
                parsed_data.productDescription,
                parsed_data.targetMarket,
                parsed_data.differentiationPoint,
                parsed_data.promotionTools,
                parsed_data.salesChannels,
            )
        )

        response_data = {
            "result": result,
            "success": True,
            "log": {
                "type": "product_promotion_strategy",
                "timestamp": str(datetime.datetime.now()),
                "input": {
                    "productDescription": parsed_data.productDescription,
                    "targetMarket": parsed_data.targetMarket,
                    "differentiationPoint": parsed_data.differentiationPoint,
                    "promotionTools": parsed_data.promotionTools,
                    "salesChannels": parsed_data.salesChannels,
                },
                "output": result,
            },
        }

        return response_data

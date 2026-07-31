import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.product_promotion_strategy import ProductPromotionStrategyService

product_promotion_strategy_bp = Blueprint()


@product_promotion_strategy_bp.route(
    route="product-promotion-strategy", methods=["POST"]
)
@azure_function_error_handler
@trace_http_azure()
def product_promotion_strategy(req: HttpRequest) -> HttpResponse:

    response_data = ProductPromotionStrategyService(
        repository=AoaiRepository(), request=req
    ).post_product_promotion_strategy()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

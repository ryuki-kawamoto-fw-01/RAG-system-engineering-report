import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.marketing_strategy import MarketingStrategyService
from service.new_marketing_strategy import NewMarketingStrategyService

marketing_strategy_bp = Blueprint()


@marketing_strategy_bp.route(route="marketing-strategy", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def marketing_strategy(req: HttpRequest) -> HttpResponse:

    response_data = MarketingStrategyService(
        repository=AoaiRepository(), request=req
    ).post_marketing_strategy()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@marketing_strategy_bp.route(route="new-marketing-strategy", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def new_marketing_strategy(req: HttpRequest) -> HttpResponse:

    response_data = NewMarketingStrategyService(
        repository=AoaiRepository(), request=req
    ).post_new_marketing_strategy()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

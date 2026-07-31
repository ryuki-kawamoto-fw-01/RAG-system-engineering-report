import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.sales_forecast import FixSalesForecastService, SalesForecastService

sales_forecast_bp = Blueprint()


# 新規作成
@sales_forecast_bp.route(route="sales-forecast", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def sales_forecast(req: HttpRequest) -> HttpResponse:
    response_data = SalesForecastService(
        repository=AoaiRepository(), request=req
    ).post_sales_forecast()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


# 結果調整
@sales_forecast_bp.route(route="fix-sales-forecast", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def fix_sales_forecast(req: HttpRequest) -> HttpResponse:

    response_data = FixSalesForecastService(
        repository=AoaiRepository(), request=req
    ).post_fix_sales_forecast()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

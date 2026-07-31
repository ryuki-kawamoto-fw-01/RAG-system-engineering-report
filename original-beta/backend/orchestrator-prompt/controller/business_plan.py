import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.business_plan import CreateBusinessPlanService
from service.business_plan_new import CreateNewBusinessPlanService

# Blueprintのインスタンスを作成
business_plan_bp = Blueprint()


# 生産技術の洗い出しエンドポイントを定義
@business_plan_bp.route(route="business_plan", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def business_plan(req: HttpRequest) -> HttpResponse:

    # CreateBusinessPlanServiceクラスのインスタンスを作成し、createメソッドを呼び出す
    response_data = CreateBusinessPlanService(
        repository=AoaiRepository(), request=req
    ).create()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@business_plan_bp.route(route="new_business_plan", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def new_business_plan(req: HttpRequest) -> HttpResponse:

    response_data = CreateNewBusinessPlanService(
        repository=AoaiRepository(), request=req
    ).post_new_business_plan()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

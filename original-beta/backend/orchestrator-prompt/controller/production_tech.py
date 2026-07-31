import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.production_tech import CreateProductionTechService
from service.production_tech_new import CreateNewProductionTechService

# Blueprintのインスタンスを作成
production_tech_bp = Blueprint()


# 生産技術の洗い出しエンドポイントを定義
@production_tech_bp.route(route="production_tech", methods=["POST"])
@azure_function_error_handler
def production_tech(req: HttpRequest) -> HttpResponse:

    # CreateProductionTechServiceクラスのインスタンスを作成し、createメソッドを呼び出す
    response_data = CreateProductionTechService(
        repository=AoaiRepository(), request=req
    ).post_production_tech()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@production_tech_bp.route(route="new_production_tech", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def new_production_tech(req: HttpRequest) -> HttpResponse:

    response_data = CreateNewProductionTechService(
        repository=AoaiRepository(), request=req
    ).post_new_production_tech()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

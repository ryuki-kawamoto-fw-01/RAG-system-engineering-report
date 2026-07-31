import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.techassess import TechassessService

techassess_bp = Blueprint()


@techassess_bp.route(route="techassess-report", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def techassess_report(req: HttpRequest) -> HttpResponse:
    aoai_repository = AoaiRepository()

    response_data = TechassessService(
        aoaiRepository=aoai_repository,
        request=req,
    ).process_techassess_report()

    # Noneや空の場合もエラーJSONを返す
    if not response_data:
        response_data = {
            "success": False,
            "message": "AIサービスから結果が返りませんでした。",
        }

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

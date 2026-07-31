import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.error_analysis import ErrorAnalysisService

error_analysis_bp = Blueprint()


@error_analysis_bp.route(route="error-analysis", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def error_analysis(req: HttpRequest) -> HttpResponse:

    response_data = ErrorAnalysisService(
        repository=AoaiRepository(), request=req
    ).post_error_analysis()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

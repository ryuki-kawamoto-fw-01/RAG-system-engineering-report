import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.summary import SummaryService

summary_bp = Blueprint()


@summary_bp.route(route="summary", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def summary(req: HttpRequest) -> HttpResponse:

    response_data = SummaryService(
        repository=AoaiRepository(), request=req
    ).post_summary()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

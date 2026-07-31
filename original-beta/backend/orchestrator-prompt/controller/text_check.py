import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.text_check import text_check_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.text_check import TextCheckService

text_check_bp = Blueprint()


@text_check_bp.route(route="text-check", methods=["POST"])
@text_check_error_handler
@trace_http_azure()
def text_check(req: HttpRequest) -> HttpResponse:

    response_data = TextCheckService(
        repository=AoaiRepository(), request=req
    ).post_text_check()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

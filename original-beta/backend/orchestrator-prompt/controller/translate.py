import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.translate import TranslateService

translate_bp = Blueprint()


@translate_bp.route(route="translate", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def translate(req: HttpRequest) -> HttpResponse:

    response_data = TranslateService(
        repository=AoaiRepository(), request=req
    ).post_translate()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

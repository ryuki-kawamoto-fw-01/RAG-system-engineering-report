import json
import logging

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.advice_react import CreateAdviceReactService

advice_react_bp = Blueprint()


@advice_react_bp.route(route="advice-react", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def advice_react(req: HttpRequest) -> HttpResponse:

    response_data = CreateAdviceReactService(
        repository=AoaiRepository(), request=req
    ).post_create_advice_react()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


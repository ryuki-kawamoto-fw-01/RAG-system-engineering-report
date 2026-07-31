import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.brainstorming import BrainstormingService
from service.new_brainstorming import NewBrainstormingService

brainstorming_bp = Blueprint()


@brainstorming_bp.route(route="brainstorming", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def brainstorming(req: HttpRequest) -> HttpResponse:

    response_data = BrainstormingService(
        repository=AoaiRepository(), request=req
    ).post_brainstorming()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@brainstorming_bp.route(route="new-brainstorming", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def new_brainstorming(req: HttpRequest) -> HttpResponse:

    response_data = NewBrainstormingService(
        repository=AoaiRepository(), request=req
    ).post_new_brainstorming()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.wall_hitting import WallHittingService
from service.wall_hitting_chat import WallHittingChatService

wall_hitting_bp = Blueprint()


@wall_hitting_bp.route(route="wall-hitting", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def wall_hitting(req: HttpRequest) -> HttpResponse:

    response_data = WallHittingService(
        repository=AoaiRepository(), request=req
    ).post_wall_hitting()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@wall_hitting_bp.route(route="wall-hitting-chat", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def wall_hitting_chat(req: HttpRequest) -> HttpResponse:
    response_data = WallHittingChatService(
        repository=AoaiRepository(), request=req
    ).post_wall_hitting_chat()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.create_idea import CreateIdeaService
from service.create_new_idea import CreateNewIdeaService

idea_bp = Blueprint()


@idea_bp.route(route="create-idea", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def create_idea(req: HttpRequest) -> HttpResponse:

    response_data = CreateIdeaService(
        repository=AoaiRepository(), request=req
    ).post_create_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@idea_bp.route(route="create-new-idea", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def create_new_idea(req: HttpRequest) -> HttpResponse:

    response_data = CreateNewIdeaService(
        repository=AoaiRepository(), request=req
    ).post_create_new_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

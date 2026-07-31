import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.prompt import prompt_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.create_prompt import CreatePromptService
from service.fix_prompt import FixPromptService

prompt_bp = Blueprint()


@prompt_bp.route(route="create-prompt", methods=["POST"])
@prompt_error_handler
@trace_http_azure()
def create_prompt(req: HttpRequest) -> HttpResponse:

    response_data = CreatePromptService(
        repository=AoaiRepository(), request=req
    ).post_create_prompt()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@prompt_bp.route(route="fix-prompt", methods=["POST"])
@prompt_error_handler
@trace_http_azure()
def fix_prompt(req: HttpRequest) -> HttpResponse:
    response_data = FixPromptService(
        repository=AoaiRepository(), request=req
    ).post_fix_prompt()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

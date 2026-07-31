import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.judge_idea import JudgeIdeaService
from service.judge_new_idea import JudgeNewIdeaService

judge_idea_bp = Blueprint()


@judge_idea_bp.route(route="judge-idea", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def judge_idea(req: HttpRequest) -> HttpResponse:

    response_data = JudgeIdeaService(
        repository=AoaiRepository(), request=req
    ).post_judge_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@judge_idea_bp.route(route="judge-new-idea", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def judge_new_idea(req: HttpRequest) -> HttpResponse:

    response_data = JudgeNewIdeaService(
        repository=AoaiRepository(), request=req
    ).post_judge_new_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

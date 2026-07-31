import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.needs_survey import NeedsSurveyService
from service.new_needs_survey import NewNeedsSurveyService

needs_survey_bp = Blueprint()


@needs_survey_bp.route(route="needs-survey", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def needs_survey(req: HttpRequest) -> HttpResponse:

    response_data = NeedsSurveyService(
        repository=AoaiRepository(), request=req
    ).post_needs_survey()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@needs_survey_bp.route(route="new-needs-survey", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def new_needs_survey(req: HttpRequest) -> HttpResponse:

    response_data = NewNeedsSurveyService(
        repository=AoaiRepository(), request=req
    ).post_new_needs_survey()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

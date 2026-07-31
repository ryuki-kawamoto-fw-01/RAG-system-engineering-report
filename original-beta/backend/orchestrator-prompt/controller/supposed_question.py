import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.supposed_question import supposed_question_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.modify_supposed_question import ModifySupposedQuestionService
from service.supposed_question import SupposedQuestionService

supposed_question_bp = Blueprint()


@supposed_question_bp.route(route="supposed-question", methods=["POST"])
@supposed_question_error_handler
@trace_http_azure()
def supposed_question(req: HttpRequest) -> HttpResponse:
    response_data = SupposedQuestionService(
        repository=AoaiRepository(), request=req
    ).post_supposed_question()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@supposed_question_bp.route(route="modify-supposed-question", methods=["POST"])
@supposed_question_error_handler
@trace_http_azure()
def modify_supposed_question(req: HttpRequest) -> HttpResponse:

    response_data = ModifySupposedQuestionService(
        repository=AoaiRepository(), request=req
    ).post_modify_supposed_question()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

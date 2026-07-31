import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.code_explanation import CodeExplanationService

code_explanation_bp = Blueprint()


@code_explanation_bp.route(route="code-explanation", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def code_explanation(req: HttpRequest) -> HttpResponse:

    response_data = CodeExplanationService(
        repository=AoaiRepository(), request=req
    ).post_code_explanation()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

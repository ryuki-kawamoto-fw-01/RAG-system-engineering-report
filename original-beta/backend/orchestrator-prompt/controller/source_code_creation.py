import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.source_code_creation import CreateSourceCodeService

source_code_bp = Blueprint()


@source_code_bp.route(route="create-source-code", methods=["POST"])
@azure_function_error_handler
def create_source_code(req: HttpRequest) -> HttpResponse:

    response_data = CreateSourceCodeService(
        repository=AoaiRepository(), request=req
    ).post_create_source_code()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

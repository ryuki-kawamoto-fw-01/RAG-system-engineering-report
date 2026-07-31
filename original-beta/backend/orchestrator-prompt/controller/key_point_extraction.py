import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.key_point_extraction import key_point_extraction_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.key_point_extraction import KeyPointExtractionService

key_point_extraction_bp = Blueprint()


@key_point_extraction_bp.route(route="key-point-extraction", methods=["POST"])
@key_point_extraction_error_handler
@trace_http_azure()
def key_point_extraction(req: HttpRequest) -> HttpResponse:

    response_data = KeyPointExtractionService(
        repository=AoaiRepository(), request=req
    ).post_key_point_extraction()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

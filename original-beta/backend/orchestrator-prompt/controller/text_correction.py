import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.text_correction import text_correction_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.text_correction import TextCorrectionService

text_correction_bp = Blueprint()


@text_correction_bp.route(route="text-correction", methods=["POST"])
@text_correction_error_handler
@trace_http_azure()
def text_correction(req: HttpRequest) -> HttpResponse:

    response_data = TextCorrectionService(
        repository=AoaiRepository(), request=req
    ).post_text_correction()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

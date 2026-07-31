import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.transcription_handwritten import transcription_handwritten_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.transcription_handwritten import TranscriptionHandwrittenService

transcription_handwritten_bp = Blueprint()


@transcription_handwritten_bp.route(route="transcription-handwritten", methods=["POST"])
@transcription_handwritten_error_handler
@trace_http_azure()
def transcription_handwritten(req: HttpRequest) -> HttpResponse:

    response_data = TranscriptionHandwrittenService(
        repository=AoaiRepository(), request=req
    ).post_transcription_handwritten()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.quality_standard_document import QualityStandardDocumentService

quality_standard_document_bp = Blueprint()


@quality_standard_document_bp.route(route="quality-standard-document", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def quality_standard_document(req: HttpRequest) -> HttpResponse:

    response_data = QualityStandardDocumentService(
        repository=AoaiRepository(), request=req
    ).post_quality_standard_document()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

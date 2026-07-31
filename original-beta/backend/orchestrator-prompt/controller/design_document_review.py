import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.design_document_review import DesignDocumentReviewService

design_document_review_bp = Blueprint()


@design_document_review_bp.route(route="design-document-review", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def design_document_review(req: HttpRequest) -> HttpResponse:
    try:
        response_data = DesignDocumentReviewService(
            repository=AoaiRepository(), request=req
        ).post_designDocumentReview()
        status = 200 if response_data.get("success") else 400
        return HttpResponse(
            json.dumps(response_data, ensure_ascii=False),
            status_code=status,
            mimetype="application/json",
        )
    except Exception as e:
        raise

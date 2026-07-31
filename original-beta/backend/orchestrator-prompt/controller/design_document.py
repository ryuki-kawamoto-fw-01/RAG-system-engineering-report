import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.create_design_document import CreateDesignDocumentService
from service.create_new_design_document import CreateNewDesignDocumentService

design_document_bp = Blueprint()


@design_document_bp.route(route="create-design-document", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def create_design_document(req: HttpRequest) -> HttpResponse:

    response_data = CreateDesignDocumentService(
        repository=AoaiRepository(), request=req
    ).post_create_design_document()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@design_document_bp.route(route="create-new-design-document", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def new_create_design_document(req: HttpRequest) -> HttpResponse:

    response_data = CreateNewDesignDocumentService(
        repository=AoaiRepository(), request=req
    ).post_create_new_design_document()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

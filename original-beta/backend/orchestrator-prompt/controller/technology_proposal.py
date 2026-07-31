import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.create_technology_proposal import CreateTechnologyProposalService
from service.fix_technology_proposal import FixTechnologyProposalService

technology_proposal_bp = Blueprint()


@technology_proposal_bp.route(route="create-technology-proposal", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def create_technology_proposal(req: HttpRequest) -> HttpResponse:

    response_data = CreateTechnologyProposalService(
        repository=AoaiRepository(), request=req
    ).post_create_technology_proposal()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@technology_proposal_bp.route(route="fix-technology-proposal", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def fix_technology_proposal(req: HttpRequest) -> HttpResponse:

    response_data = FixTechnologyProposalService(
        repository=AoaiRepository(), request=req
    ).post_fix_technology_proposal()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

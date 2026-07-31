import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.fix_new_product_proposal import FixNewProductProposalService
from service.new_product_proposal import NewProductProposalService

new_product_proposal_bp = Blueprint()


@new_product_proposal_bp.route(route="new-product-proposal", methods=["POST"])
@azure_function_error_handler
def new_product_proposal(req: HttpRequest) -> HttpResponse:

    response_data = NewProductProposalService(
        repository=AoaiRepository(), request=req
    ).post_new_product_proposal()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@new_product_proposal_bp.route(route="fix-product-proposal", methods=["POST"])
@azure_function_error_handler
def fix_new_product_proposal(req: HttpRequest) -> HttpResponse:

    response_data = FixNewProductProposalService(
        repository=AoaiRepository(), request=req
    ).post_fix_new_product_proposal()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

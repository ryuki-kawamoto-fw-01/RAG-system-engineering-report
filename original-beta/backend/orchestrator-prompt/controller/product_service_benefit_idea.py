import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.product_service_benefit_idea import ProductServiceBenefitIdeaService
from service.product_service_benefit_new_idea import ProductServiceBenefitNewIdeaService

product_service_benefit_idea_bp = Blueprint()


@product_service_benefit_idea_bp.route(
    route="product-service-benefit-idea", methods=["POST"]
)
@azure_function_error_handler
@trace_http_azure()
def product_service_benefit_idea(req: HttpRequest) -> HttpResponse:

    response_data = ProductServiceBenefitIdeaService(
        repository=AoaiRepository(), request=req
    ).post_create_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@product_service_benefit_idea_bp.route(
    route="product-service-benefit-new-idea", methods=["POST"]
)
@azure_function_error_handler
@trace_http_azure()
def product_service_benefit_new_idea(req: HttpRequest) -> HttpResponse:

    response_data = ProductServiceBenefitNewIdeaService(
        repository=AoaiRepository(), request=req
    ).post_create_new_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

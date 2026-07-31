import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.product_aarrr import ProductAarrrService

product_aarrr_bp = Blueprint()


@product_aarrr_bp.route(route="product-aarrr", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def product_aarrr(req: HttpRequest) -> HttpResponse:

    response_data = ProductAarrrService(
        repository=AoaiRepository(), request=req
    ).post_product_aarrr()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

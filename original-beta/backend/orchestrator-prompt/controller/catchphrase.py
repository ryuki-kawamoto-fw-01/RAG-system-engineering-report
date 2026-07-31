import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.catchphrase import catchphrase_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.product_catchphrase import ProductCatchphraseService

catchphrase_bp = Blueprint()


@catchphrase_bp.route(route="product-catchphrase", methods=["POST"])
@catchphrase_error_handler
@trace_http_azure()
def product_catchphrase(req: HttpRequest) -> HttpResponse:

    response_data = ProductCatchphraseService(
        repository=AoaiRepository(), request=req
    ).post_product_catchphrase()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.product_idea import product_idea_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.create_product_idea import CreateProductIdeaService
from service.update_product_idea import UpdateProductIdeaService

product_idea_bp = Blueprint()


# 新しい商品案を作る
@product_idea_bp.route(route="create-product-idea", methods=["POST"])
@product_idea_error_handler
@trace_http_azure()
def create_product_idea(req: HttpRequest) -> HttpResponse:

    response_data = CreateProductIdeaService(
        repository=AoaiRepository(), request=req
    ).post_create_product_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


# 商品アイデアの修正
@product_idea_bp.route(route="update-product-idea", methods=["POST"])
@product_idea_error_handler
@trace_http_azure()
def update_product_idea(req: HttpRequest) -> HttpResponse:

    response_data = UpdateProductIdeaService(
        repository=AoaiRepository(), request=req
    ).post_update_product_idea()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.product_comparison_service import ProductComparisonService

# Blueprintのインスタンスを作成
product_comparison_bp = Blueprint()


# 製品比較エンドポイントを定義
@product_comparison_bp.route(route="product-comparison", methods=["POST"])
@azure_function_error_handler
def compare_products(req: HttpRequest) -> HttpResponse:

    # ProductComparisonServiceクラスのインスタンスを作成し、compareメソッドを呼び出す
    response_data = ProductComparisonService(
        repository=AoaiRepository(), request=req
    ).compare()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

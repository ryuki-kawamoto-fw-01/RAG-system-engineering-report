import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.faq_creation import FaqService

faq_creation_bp = Blueprint()


@faq_creation_bp.route(route="faq-creation", methods=["POST"])
@azure_function_error_handler
def create_faq(req: HttpRequest) -> HttpResponse:

    # FaqServiceクラスのインスタンスを作成し、post_faqメソッドを呼び出す
    response_data = FaqService(repository=AoaiRepository(), request=req).post_faq()

    # 正常にFAQが作成された場合のレスポンス
    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

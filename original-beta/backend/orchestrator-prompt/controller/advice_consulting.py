import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.advice_consulting import AdviceConsultingService

advice_consulting_bp = Blueprint()


@advice_consulting_bp.route(route="advice-consulting", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def advice_consulting(req: HttpRequest) -> HttpResponse:

    response_data = AdviceConsultingService(
        repository=AoaiRepository(), request=req
    ).post_advice_consulting()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

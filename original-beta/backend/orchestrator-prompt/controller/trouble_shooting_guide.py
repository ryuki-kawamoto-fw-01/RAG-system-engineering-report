import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.trouble_shooting_guide import trouble_shooting_guide_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.trouble_shooting_guide import TroubleShootingGuideService

trouble_shooting_guide_bp = Blueprint()


@trouble_shooting_guide_bp.route(route="trouble-shooting-guide", methods=["POST"])
@trouble_shooting_guide_error_handler
@trace_http_azure()
def trouble_shooting_guide(req: HttpRequest) -> HttpResponse:
    response_data = TroubleShootingGuideService(
        repository=AoaiRepository(), request=req
    ).post_trouble_shooting_guide()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

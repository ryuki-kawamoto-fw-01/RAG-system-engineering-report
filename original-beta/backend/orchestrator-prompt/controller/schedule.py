import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.schedule import ScheduleService

schedule_bp = Blueprint()


@schedule_bp.route(route="schedule", methods=["POST"])
@azure_function_error_handler
def schedule(req: HttpRequest) -> HttpResponse:

    response_data = ScheduleService(
        repository=AoaiRepository(), request=req
    ).post_schedule()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.crisis_management_scenarios import CrisisManagementScenariosService
from service.new_crisis_management_scenarios import NewCrisisManagementScenariosService

crisis_management_scenarios_bp = Blueprint()


@crisis_management_scenarios_bp.route(
    route="crisis-management-scenarios", methods=["POST"]
)
@azure_function_error_handler
@trace_http_azure()
def crisis_management_scenarios(req: HttpRequest) -> HttpResponse:

    response_data = CrisisManagementScenariosService(
        repository=AoaiRepository(), request=req
    ).post_crisis_management_scenarios()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@crisis_management_scenarios_bp.route(
    route="new-crisis-management-scenarios", methods=["POST"]
)
@azure_function_error_handler
@trace_http_azure()
def new_crisis_management_scenarios(req: HttpRequest) -> HttpResponse:

    response_data = NewCrisisManagementScenariosService(
        repository=AoaiRepository(), request=req
    ).post_new_crisis_management_scenarios()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

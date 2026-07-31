import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.fix_training import FixTrainingService
from service.technology_training import TechnologyTrainingService

technology_training_bp = Blueprint()


@technology_training_bp.route(route="technology-training", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def technology_training(req: HttpRequest) -> HttpResponse:

    response_data = TechnologyTrainingService(
        repository=AoaiRepository(), request=req
    ).post_technology_training()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@technology_training_bp.route(route="fix-training", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def fix_training(req: HttpRequest) -> HttpResponse:

    response_data = FixTrainingService(
        repository=AoaiRepository(), request=req
    ).post_fix_training()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

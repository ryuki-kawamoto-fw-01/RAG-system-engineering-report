import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.task_breakdown import FixTaskBreakdownService, TaskBreakdownService

taskBreakdown_bp = Blueprint()


@taskBreakdown_bp.route(route="task-breakdown", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def task_breakdown(req: HttpRequest) -> HttpResponse:
    response_data = TaskBreakdownService(
        repository=AoaiRepository(), request=req
    ).post_task_breakdown()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@taskBreakdown_bp.route(route="fix-task-breakdown", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def fix_task_breakdown(req: HttpRequest) -> HttpResponse:
    response_data = FixTaskBreakdownService(
        repository=AoaiRepository(), request=req
    ).post_fix_task_breakdown()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

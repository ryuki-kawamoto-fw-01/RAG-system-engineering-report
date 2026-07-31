import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.research_new_report import ResearchNewReportService
from service.research_report import ResearchReportService

research_report_bp = Blueprint()


@research_report_bp.route(route="research-report", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def research_report(req: HttpRequest) -> HttpResponse:

    response_data = ResearchReportService(
        repository=AoaiRepository(), request=req
    ).post_research_report()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@research_report_bp.route(route="research-new-report", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def research_new_report(req: HttpRequest) -> HttpResponse:

    response_data = ResearchNewReportService(
        repository=AoaiRepository(), request=req
    ).post_research_new_report()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

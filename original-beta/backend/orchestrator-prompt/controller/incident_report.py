import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.incident_report import IncidentReportService

incident_report_bp = Blueprint()


@incident_report_bp.route(route="incident-report", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def incident_report(req: HttpRequest) -> HttpResponse:
    import logging

    print("[incident_report] called")
    logging.info("[incident_report] called")

    response_data = IncidentReportService(
        repository=AoaiRepository(), request=req
    ).post_incident_report()

    # Noneや不正な値の場合はエラーJSONを返す
    if response_data is None or not isinstance(response_data, (dict, list)):
        response_data = {
            "success": False,
            "message": "No valid data returned from service.",
        }

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

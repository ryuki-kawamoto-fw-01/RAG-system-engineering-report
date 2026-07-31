import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.risk_assessment import RiskAssessmentService, parse_markdown_table

risk_assessment_bp = Blueprint()


@risk_assessment_bp.route(route="risk-assessment", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def risk_assessment(req: HttpRequest) -> HttpResponse:

    response_data = RiskAssessmentService(
        repository=AoaiRepository(), request=req
    ).post_risk_assessment()

    parsed_result = parse_markdown_table(response_data["result"])

    response_data["result"] = parsed_result

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

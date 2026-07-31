import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.company_analysis import CompanyAnalysisService
from service.company_reanalysis import CompanyReanalysisService

company_analysis_bp = Blueprint()


@company_analysis_bp.route(route="company-analysis", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def company_analysis(req: HttpRequest) -> HttpResponse:

    response_data = CompanyAnalysisService(
        repository=AoaiRepository(), request=req
    ).post_company_analysis()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@company_analysis_bp.route(route="company-analysis/reanalysis", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def reanalysis(req: HttpRequest) -> HttpResponse:

    response_data = CompanyReanalysisService(
        repository=AoaiRepository(), request=req
    ).post_company_reanalysis()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

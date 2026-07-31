import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.defect_analysis_report import defect_analysis_report_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.defect_analysis_report import DefectAnalysisReportService
from service.fix_defect_analysis_report import FixDefectAnalysisReportService

defect_analysis_report_bp = Blueprint()


@defect_analysis_report_bp.route(route="defect-analysis-report", methods=["POST"])
@defect_analysis_report_error_handler
@trace_http_azure()
def defect_analysis_report_create(req: HttpRequest) -> HttpResponse:

    response_data = DefectAnalysisReportService(
        repository=AoaiRepository(), request=req
    ).post_defect_analysis_report()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@defect_analysis_report_bp.route(route="fix-defect-analysis-report", methods=["POST"])
@defect_analysis_report_error_handler
@trace_http_azure()
def defect_analysis_report_fix_content(req: HttpRequest) -> HttpResponse:
    response_data = FixDefectAnalysisReportService(
        repository=AoaiRepository(), request=req
    ).post_fix_defect_analysis_report()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

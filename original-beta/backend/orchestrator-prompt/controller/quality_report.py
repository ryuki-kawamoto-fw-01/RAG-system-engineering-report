import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.quality_report import quality_report_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.quality_report import QualityReportService

quality_report_bp = Blueprint()


@quality_report_bp.route(route="quality-report", methods=["POST"])
@quality_report_error_handler
@trace_http_azure()
def quality_report(req: HttpRequest) -> HttpResponse:
    """品質保証レポート生成エンドポイント"""

    response_data = QualityReportService(
        repository=AoaiRepository(), request=req
    ).post_quality_report()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

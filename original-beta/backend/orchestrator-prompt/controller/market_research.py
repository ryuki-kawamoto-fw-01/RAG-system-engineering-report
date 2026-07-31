import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.fix_market_report import FixMarketReportService
from service.market_research_report import MarketResearchReportService

market_research_report_bp = Blueprint()


@market_research_report_bp.route(route="market-research-report", methods=["POST"])
@azure_function_error_handler
def market_research_report(req: HttpRequest) -> HttpResponse:

    response_data = MarketResearchReportService(
        repository=AoaiRepository(), request=req
    ).post_market_research_report()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@market_research_report_bp.route(route="fix-market-report", methods=["POST"])
@azure_function_error_handler
def fix_market_report(req: HttpRequest) -> HttpResponse:

    response_data = FixMarketReportService(
        repository=AoaiRepository(), request=req
    ).post_fix_market_report()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

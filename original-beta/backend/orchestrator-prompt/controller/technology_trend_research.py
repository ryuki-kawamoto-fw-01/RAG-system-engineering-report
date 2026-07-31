import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.technology_trend_research import TechnologyTrendResearchService

technology_trend_research_bp = Blueprint()


@technology_trend_research_bp.route(route="technology-trend-research", methods=["POST"])
@azure_function_error_handler
def technology_trend_research(req: HttpRequest) -> HttpResponse:

    response_data = TechnologyTrendResearchService(
        repository=AoaiRepository(), request=req
    ).post_technology_trend_research()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

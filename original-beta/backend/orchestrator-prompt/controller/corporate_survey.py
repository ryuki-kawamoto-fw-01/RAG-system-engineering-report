import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.corporate_survey import CorporateSurveyService


from modules.error_handler import azure_function_error_handler


corporate_survey_bp = Blueprint()


@corporate_survey_bp.route(route="corporate-survey", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def corporate_survey(req: HttpRequest) -> HttpResponse:
    # bing_repository = BingSearchRepository()
    aoai_repository = AoaiRepository()
    # web_search_service = WebSearchService(bingSearchRepository=bing_repository)

    response_data = CorporateSurveyService(
        aoaiRepository=aoai_repository,
        # webSearchService=web_search_service,
        request=req,
    ).process_corporate_survey()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

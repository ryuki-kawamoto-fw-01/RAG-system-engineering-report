import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.term_summary import TermSummaryService

term_summary_bp = Blueprint()


@term_summary_bp.route(route="term-summary", methods=["POST"])
@azure_function_error_handler
def term_summary(req: HttpRequest) -> HttpResponse:

    response_data = TermSummaryService(
        repository=AoaiRepository(), request=req
    ).post_term_summary()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

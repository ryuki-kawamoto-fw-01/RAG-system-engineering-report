import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.problem_solving_advisor import ProblemSolvingAdvisorService

problem_solving_advisor_bp = Blueprint()


@problem_solving_advisor_bp.route(route="problem_solving_advisor", methods=["POST"])
@azure_function_error_handler
def problem_solving_advisor(req: HttpRequest) -> HttpResponse:

    response_data = ProblemSolvingAdvisorService(
        repository=AoaiRepository(), request=req
    ).problem_solving_advisor()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

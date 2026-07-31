import azure.functions as func

from controller.survey_creation import survey_creation_post

survey_creation_bp = func.Blueprint()


@survey_creation_bp.route(route="survey-creation", methods=["POST"])
def survey_creation_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    return survey_creation_post(req)

import json
import logging

import azure.functions as func

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.survey_creation import SurveyCreationService


def survey_creation_post(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info("アンケート作成 Request Received")

        service = SurveyCreationService(AoaiRepository(), req)
        result = service.post_survey_creation()

        return func.HttpResponse(
            json.dumps(result, ensure_ascii=False, indent=2),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as e:
        return azure_function_error_handler(e)

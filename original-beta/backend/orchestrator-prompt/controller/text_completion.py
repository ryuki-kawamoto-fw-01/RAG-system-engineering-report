import json
import logging

import azure.functions as func

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.text_completion import TextCompletionService


def text_completion_post(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info("文章補完 Request Received")

        service = TextCompletionService(AoaiRepository(), req)
        result = service.post_text_completion()

        return func.HttpResponse(
            json.dumps(result, ensure_ascii=False, indent=2),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as e:
        return azure_function_error_handler(e)

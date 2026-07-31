import azure.functions as func

from controller.text_completion import text_completion_post

text_completion_bp = func.Blueprint()


@text_completion_bp.route(route="text-completion", methods=["POST"])
def text_completion_endpoint(req: func.HttpRequest) -> func.HttpResponse:
    return text_completion_post(req)

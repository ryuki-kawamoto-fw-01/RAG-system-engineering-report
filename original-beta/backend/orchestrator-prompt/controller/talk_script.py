import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.talk_script import talk_script_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.create_talk_script import CreateTalkScriptService
from service.fix_talk_script import FixTalkScriptService

talk_script_bp = Blueprint()


@talk_script_bp.route(route="create-talk-script", methods=["POST"])
@talk_script_error_handler
@trace_http_azure()
def create_talk_script(req: HttpRequest) -> HttpResponse:

    response_data = CreateTalkScriptService(
        repository=AoaiRepository(), request=req
    ).post_create_talk_script()
    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@talk_script_bp.route(route="fix-talk-script", methods=["POST"])
@talk_script_error_handler
@trace_http_azure()
def fix_talk_script(req: HttpRequest) -> HttpResponse:
    response_data = FixTalkScriptService(
        repository=AoaiRepository(), request=req
    ).post_fix_talk_script()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

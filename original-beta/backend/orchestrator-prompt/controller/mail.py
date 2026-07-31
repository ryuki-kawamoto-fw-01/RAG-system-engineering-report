import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from interceptor.mail import mail_error_handler
from modules.contextLog.logger import trace_http_azure
from repository.aoai import AoaiRepository
from service.create_new_mail import CreateNewMailService
from service.create_reply_mail import CreateReplyMailService
from service.fix_new_mail import FixNewMailService
from service.fix_reply_mail import FixReplyMailService

mail_bp = Blueprint()


@mail_bp.route(route="create-new-mail", methods=["POST"])
@mail_error_handler
@trace_http_azure()
def create_new_mail(req: HttpRequest) -> HttpResponse:

    response_data = CreateNewMailService(
        repository=AoaiRepository(), request=req
    ).post_create_new_mail()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@mail_bp.route(route="create-reply-mail", methods=["POST"])
@mail_error_handler
@trace_http_azure()
def create_reply_mail(req: HttpRequest) -> HttpResponse:
    response_data = CreateReplyMailService(
        repository=AoaiRepository(), request=req
    ).post_create_reply_mail()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@mail_bp.route(route="fix-new-mail", methods=["POST"])
@mail_error_handler
@trace_http_azure()
def fix_new_mail(req: HttpRequest) -> HttpResponse:
    response_data = FixNewMailService(
        repository=AoaiRepository(), request=req
    ).post_fix_new_mail()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@mail_bp.route(route="fix-reply-mail", methods=["POST"])
@mail_error_handler
@trace_http_azure()
def fix_reply_mail(req: HttpRequest) -> HttpResponse:
    response_data = FixReplyMailService(
        repository=AoaiRepository(), request=req
    ).post_fix_reply_mail()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json
import logging

from azure.functions import Blueprint, HttpRequest, HttpResponse
from pydantic import ValidationError

from interceptor.minutes import minutes_error_handler
from modules.contextLog.logger import trace_http_azure
from modules.create_excel import create_excel_minutes
from repository.aoai import AoaiRepository
from service.create_minutes import CreateMinutesService
from service.download_minutes import DownloadMinutesService
from service.fix_minutes import FixMinutesService

minutes_bp = Blueprint()


@minutes_bp.route(route="create-minutes", methods=["POST"])
@minutes_error_handler
@trace_http_azure()
def create_minutes(req: HttpRequest) -> HttpResponse:

    response_data = CreateMinutesService(
        repository=AoaiRepository(), request=req
    ).post_create_minutes()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@minutes_bp.route(route="fix-minutes", methods=["POST"])
@minutes_error_handler
@trace_http_azure()
def fix_minutes(req: HttpRequest) -> HttpResponse:

    response_data = FixMinutesService(
        repository=AoaiRepository(), request=req
    ).post_fix_minutes()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@minutes_bp.route(route="download-minutes", methods=["POST"])
def download_minutes(req: HttpRequest) -> HttpResponse:
    try:
        response_data = DownloadMinutesService(
            repository=AoaiRepository(),
            request=req,
        ).post_download_minutes()
        output_excel = create_excel_minutes(response_data["answer"])
        response = HttpResponse(
            body=output_excel.getvalue(),
            status_code=200,
            headers={
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment; filename=minutes.xlsx",
            },
        )
        return response
    except FileNotFoundError as e:
        logging.error(f"Template file error: {e}")
        return HttpResponse(
            json.dumps(
                {"error": "テンプレートファイルが見つかりません", "message": str(e)}
            ),
            status_code=500,
            mimetype="application/json",
        )
    except ValidationError as e:
        logging.info(f"Validation Error: {e}")
        return HttpResponse(
            json.dumps(
                {
                    "error": "エラーが発生しました",
                    "message": str([x.get("msg") for x in e.errors()][0]),
                }
            ),
            status_code=400,
            mimetype="application/json",
        )
    except Exception as e:
        logging.error(f"Error: {e}")
        return HttpResponse(
            json.dumps({"error": "エラーが発生しました", "message": str(e)}),
            status_code=500,
            mimetype="application/json",
        )

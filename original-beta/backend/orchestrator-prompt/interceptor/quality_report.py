import json
import logging
from datetime import UTC, datetime
from typing import Any, Callable

import azure.functions as azure_func

from modules.error_handler import ErrorCode, ErrorHandler
from modules.errors.error_definitions import ERROR_MESSAGES


class QualityReportInterceptor(ErrorHandler):
    @classmethod
    def _resolve_error_table(
        cls, err: Exception, req: azure_func.HttpRequest
    ) -> tuple[str, ErrorCode, dict[str, Any]]:
        return super()._resolve_error_table(err, req)

    # handle_errorは親クラスのものを使用


def quality_report_error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable[[azure_func.HttpRequest], azure_func.HttpResponse]:
    """Azure Functions の trigger シグネチャを保つラッパー"""

    def wrapper(req: azure_func.HttpRequest) -> azure_func.HttpResponse:
        try:
            return func(req)
        except Exception as err:
            error_response, status_code = QualityReportInterceptor.handle_error(err, req)
            return azure_func.HttpResponse(
                json.dumps(
                    error_response,
                    ensure_ascii=False,
                ),
                status_code=status_code,
                mimetype="application/json",
            )

    wrapper.__name__ = func.__name__  # デプロイ時の関数名を維持
    return wrapper

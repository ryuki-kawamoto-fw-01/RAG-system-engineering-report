import json
from typing import Any, Callable

import azure.functions as azure_func

from modules.error_handler import ErrorCode, ErrorHandler
from modules.errors.error_definitions import ERROR_MESSAGES


class ErrorAnalysisInterceptor(ErrorHandler):
    @classmethod
    def _resolve_error_table(
        cls, err: Exception, req: azure_func.HttpRequest
    ) -> tuple[str, ErrorCode, dict[str, Any]]:
        return super()._resolve_error_table(err, req)

    @classmethod
    def _file_table(cls, extension: str) -> tuple[str, ErrorCode, dict[str, Any]]:
        if extension in ["pdf", "docx", "txt"]:
            return (
                ERROR_MESSAGES["E001"],
                ErrorCode.INVALID_VALUE,
                {
                    "path": "fileList",
                    "value": None,
                    "expected": "アップロードされたファイルが暗号化されています。",
                },
            )
        return (
            ERROR_MESSAGES["E002"],
            ErrorCode.INVALID_VALUE,
            {
                "path": "fileList",
                "value": None,
                "expected": "対応していないファイル形式です。",
            },
        )


def error_analysis_error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable[[azure_func.HttpRequest], azure_func.HttpResponse]:
    """Azure Functions の trigger シグネチャを保つラッパー"""
    # wrapperの引数はreq: azure_func.HttpRequestにしないとAzureFunctionに登録されない

    def wrapper(req: azure_func.HttpRequest) -> azure_func.HttpResponse:
        try:
            return func(req)
        except Exception as e:  # noqa: BLE001
            error_response, status_code = ErrorAnalysisInterceptor.handle_error(e, req)
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

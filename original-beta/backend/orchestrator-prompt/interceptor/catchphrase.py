import json
import logging
from datetime import UTC, datetime
from typing import Any, Callable

import azure.functions as azure_func

from modules.error_handler import ErrorCode, ErrorHandler
from modules.errors.error_definitions import ERROR_MESSAGES
from modules.validation.common import CommonValidation


class CatchphraseInterceptor(ErrorHandler):
    @classmethod
    def _resolve_error_table(
        cls, err: Exception, req: azure_func.HttpRequest
    ) -> tuple[str, ErrorCode, dict[str, Any]]:
        # ファイルの暗号化チェック
        for key, file in req.files.items():
            if file.filename:
                logging.info(
                    (
                        f"キー: {key}, ファイル名: {file.filename}, "
                        f"暗号化: {CommonValidation.is_encrypted(file)}"
                    )
                )
            extension: str = file.filename.split(".")[-1]
            if CommonValidation.is_encrypted(file):
                return cls._file_table(extension)
        return super()._resolve_error_table(err, req)

    # handle_errorは親クラスのものを使用


def catchphrase_error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable[[azure_func.HttpRequest], azure_func.HttpResponse]:
    """Azure Functions の trigger シグネチャを保つラッパー"""
    # wrapperの引数はreq: azure_func.HttpRequestにしないとAzureFunctionに登録されない

    def wrapper(req: azure_func.HttpRequest) -> azure_func.HttpResponse:
        try:
            return func(req)
        except Exception as e:  # noqa: BLE001
            error_response, status_code = CatchphraseInterceptor.handle_error(e, req)
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

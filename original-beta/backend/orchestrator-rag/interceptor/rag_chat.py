import base64
import functools
import json
import logging
from datetime import UTC, datetime
from typing import Any, Callable, Optional, Union

import azure.functions as azure_func
from azure.storage.blob import BlobClient

from modules.common import create_tempfile_container_client
from modules.error_handler import ErrorCode, ErrorHandler
from modules.errors.error_definitions import ERROR_MESSAGES
from modules.validation.common import CommonValidation


class RagChatInterceptor(ErrorHandler):
    @classmethod
    def _resolve_error_table(
        cls, err: Exception, req: azure_func.HttpRequest
    ) -> tuple[str, ErrorCode, dict[str, Any]]:
        req_body = req.get_json()
        file_name: Optional[str] = req_body.get("fileName")
        # ファイルの暗号化チェック
        if file_name is not None:
            container_client = create_tempfile_container_client()
            blob_client: BlobClient = container_client.get_blob_client(blob=file_name)
            blob_data = blob_client.download_blob().readall()

            file_content: Optional[Union[bytes, str]] = base64.encodebytes(
                blob_data
            ).decode("utf-8")
            file = base64.b64decode(file_content)
            extension: str = file_name.split(".")[-1]
            logging.info(
                (
                    f"ファイル名: {file_name}, "
                    f"暗号化: {CommonValidation.is_encrypted(file, extension)}"
                )
            )
            if CommonValidation.is_encrypted(file, extension):
                return cls._file_table(extension)
        return super()._resolve_error_table(err)

    @classmethod
    def handle_error(
        cls, err: Exception, req: azure_func.HttpRequest
    ) -> azure_func.HttpResponse:
        error_id, http_status, fmt_kwargs = cls._resolve_error_table(err, req)
        template = ERROR_MESSAGES.get(error_id, "予期しない問題が発生しました。")
        error_message = cls._safe_format(template, **fmt_kwargs)

        error_type = type(err)

        error_response: dict[str, Any] = {
            "error_id": error_id,
            "error_message": error_message,
            "status_code": http_status.value,
            "log_details": {
                "error_type": error_type.__name__,
                "timestamp": datetime.now(UTC).isoformat(),
                "tags": cls._get_error_tags(error_type),
            },
        }

        # ログ
        logging.error(
            f"[{error_id}] {error_message}",
            extra={
                "error_type": error_type.__name__,
                "tags": cls._get_error_tags(error_type),
            },
            exc_info=err,  # スタックトレースを含む詳細情報を出力
        )
        return error_response, http_status.value


def rag_chat_error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable[[azure_func.HttpRequest], azure_func.HttpResponse]:
    """Azure Functions の trigger シグネチャを保つラッパー"""

    # wrapperの引数はreq: azure_func.HttpRequestにしないとAzureFunctionに登録されない
    @functools.wraps(func)
    def wrapper(req: azure_func.HttpRequest) -> azure_func.HttpResponse:
        try:
            return func(req)
        except Exception as e:  # noqa: BLE001
            error_response, status_code = RagChatInterceptor.handle_error(e, req)
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

# -*- coding: utf-8 -*-
"""
Azure Functions 用エラーハンドラ（生成 AI 版）
- エラーメッセージ／ID は `modules.errors.error_definitions` を参照
"""
from __future__ import annotations

import ast
import json
import logging
import string
from collections import defaultdict
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Callable, Dict, Tuple, Type

import azure.functions as azure_func
from openai._exceptions import (
    BadRequestError,
    NotFoundError,
    OpenAIError,
    PermissionDeniedError,
)

from .errors.custom_errors import LLMSpecificError

# --- アプリ固有 ---
from .errors.error_definitions import ERROR_MESSAGES
from .logging.constants import TAG_GROUPS, LogTag


# ------------------ 共通定義 ------------------ #
class ErrorCode(Enum):
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    RATE_LIMIT = 429
    CONFLICT = 409
    INTERNAL_ERROR = 500
    SERVICE_UNAVAILABLE = 503


# OpenAI 例外 → (ErrorID, HTTP Status) 対応表
# ※ BadRequestError だけは内容を精査して動的に振り分ける
EXC_TO_TABLE: dict[Type[Exception], tuple[str, ErrorCode]] = {
    NotFoundError: ("E_B4_00130", ErrorCode.NOT_FOUND, {"value": "フォルダ"}),
    FileNotFoundError: ("E_B4_00130", ErrorCode.NOT_FOUND, {"value": "ファイル"}),
    PermissionDeniedError: (
        "E_B4_00150",
        ErrorCode.FORBIDDEN,
    ),
    FileExistsError: ("E_B4_00140", ErrorCode.CONFLICT),
    ValueError: ("E_B4_00120", ErrorCode.BAD_REQUEST),
    KeyError: ("E_B4_00110", ErrorCode.BAD_REQUEST),
    LLMSpecificError: ("", ErrorCode.INTERNAL_ERROR),  # LLMSpecificError は動的に決まる
    Exception: ("E_B4_00080", ErrorCode.INTERNAL_ERROR),
}


# ------------------ 本体 ------------------ #
class ErrorHandler:
    """中心となる静的ハンドラ"""

    # ---------- 内部 util ---------- #
    @staticmethod
    def _safe_format(template: str, **kwargs: Any) -> str:
        """不足キーがあっても落ちない format"""
        fmt_dict = defaultdict(str, **kwargs)
        return string.Formatter().vformat(template, (), fmt_dict)  # type: ignore[arg-type]

    @classmethod
    def _get_error_tags(cls, error_type: Type[Exception]) -> list[str]:
        """ログ用タグを生成"""
        if issubclass(error_type, OpenAIError):
            return TAG_GROUPS["CHAT"]
        elif issubclass(error_type, ValueError):
            return [LogTag.TEXT.value]
        return [LogTag.TEXT.value]

    # ---------- ErrorID / HTTP ステータス決定 ---------- #
    @classmethod
    def _resolve_error_table(
        cls, err: Exception
    ) -> tuple[str, ErrorCode, dict[str, Any]]:
        """
        例外を ErrorID と HTTP ステータスに変換
        戻り値:
            error_id, http_status, 置換用kwargs
        """
        if isinstance(err, LLMSpecificError):
            return err.error_id, ErrorCode.INTERNAL_ERROR, err.fmt_kwargs

        err_type = type(err)

        # 既定テーブルを使用
        error_id, http_status = EXC_TO_TABLE.get(err_type, EXC_TO_TABLE[Exception])
        return error_id, http_status, {"value": "メッセージ"}

    # JSON っぽい文字列を頑張って辞書化
    @staticmethod
    def _try_extract_json(raw: str) -> dict[str, Any] | None:
        # OpenAI ライブラリは `"BadRequestError - {'error': …}"` の形式
        if " - " in raw:
            raw = raw.split(" - ", 1)[1]
        try:
            return ast.literal_eval(raw)
        except (json.JSONDecodeError, TypeError):
            return None

    # ---------- Public API ---------- #
    @classmethod
    def handle_error(cls, err: Exception) -> Tuple[Dict[str, Any], int]:
        error_id, http_status, fmt_kwargs = cls._resolve_error_table(err)
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
        )
        return error_response, http_status.value


# ------------------ Decorators ------------------ #
def error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable:
    """Fast decorator for internal wrappers"""

    def wrapper(*args: Any, **kwargs: Any) -> azure_func.HttpResponse:
        try:
            return func(*args, **kwargs)
        except Exception as e:  # noqa: BLE001
            error_response, status_code = ErrorHandler.handle_error(e)
            return azure_func.HttpResponse(
                json.dumps(error_response, ensure_ascii=False),
                status_code=status_code,
                mimetype="application/json",
            )

    return wrapper


def azure_function_rename_error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable[[azure_func.HttpRequest], azure_func.HttpResponse]:
    """Azure Functions の trigger シグネチャを保つラッパー"""
    # wrapperの引数はreq: azure_func.HttpRequestにしないとAzureFunctionに登録されない

    def wrapper(req: azure_func.HttpRequest) -> azure_func.HttpResponse:
        try:
            return func(req)
        except Exception as e:  # noqa: BLE001
            error_response, status_code = ErrorHandler.handle_error(e)
            return azure_func.HttpResponse(
                json.dumps(error_response, ensure_ascii=False),
                status_code=status_code,
                mimetype="application/json",
            )

    wrapper.__name__ = func.__name__  # デプロイ時の関数名を維持
    return wrapper

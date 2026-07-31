# -*- coding: utf-8 -*-
"""
Azure Functions 用エラーハンドラ（生成 AI 版）
- エラーメッセージ／ID は `modules.errors.error_definitions` を参照
"""
from __future__ import annotations

import ast
import json
import logging
import re
import string
from collections import defaultdict
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Callable, Dict, Tuple, Type

import azure.functions as azure_func
from openai._exceptions import (
    APIConnectionError,
    APIError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    ConflictError,
    InternalServerError,
    NotFoundError,
    OpenAIError,
    PermissionDeniedError,
    RateLimitError,
    UnprocessableEntityError,
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
    INTERNAL_ERROR = 500
    SERVICE_UNAVAILABLE = 503


# OpenAI 例外 → (ErrorID, HTTP Status) 対応表
# ※ BadRequestError だけは内容を精査して動的に振り分ける
EXC_TO_TABLE: dict[Type[Exception], tuple[str, ErrorCode]] = {
    RateLimitError: ("E_B2_00030", ErrorCode.RATE_LIMIT),
    APIConnectionError: ("E_B2_00040", ErrorCode.SERVICE_UNAVAILABLE),
    APITimeoutError: ("E_B2_00040", ErrorCode.SERVICE_UNAVAILABLE),
    APIError: ("E_B2_00040", ErrorCode.SERVICE_UNAVAILABLE),
    AuthenticationError: (
        "E_B2_00050",
        ErrorCode.UNAUTHORIZED,
    ),  # 現状エラー定義のエクセル表から無理やり持ってきているが、必要に応じてより特化したエラーメッセージを追加する
    ConflictError: (
        "E_B2_00050",
        ErrorCode.INTERNAL_ERROR,
    ),  # 現状エラー定義のエクセル表から無理やり持ってきているが、必要に応じてより特化したエラーメッセージを追加する
    InternalServerError: ("E_B2_00010", ErrorCode.INTERNAL_ERROR),
    NotFoundError: (
        "E_B2_00010",
        ErrorCode.NOT_FOUND,
    ),  # 現状エラー定義のエクセル表から無理やり持ってきているが、必要に応じてより特化したエラーメッセージを追加する
    PermissionDeniedError: (
        "E_B2_00050",
        ErrorCode.FORBIDDEN,
    ),  # 現状エラー定義のエクセル表から無理やり持ってきているが、必要に応じてより特化したエラーメッセージを追加する
    UnprocessableEntityError: (
        "E_B2_00050",
        ErrorCode.INTERNAL_ERROR,
    ),  # 現状エラー定義のエクセル表から無理やり持ってきているが、必要に応じてより特化したエラーメッセージを追加する
    ValueError: ("E_B2_00060", ErrorCode.BAD_REQUEST),
    KeyError: ("E_B2_00070", ErrorCode.BAD_REQUEST),
    LLMSpecificError: ("", ErrorCode.INTERNAL_ERROR),  # LLMSpecificError は動的に決まる
    Exception: ("E_B2_00080", ErrorCode.INTERNAL_ERROR),
}

# BadRequestError 判定用パターン
_TOKEN_OVERRUN_RE = re.compile(
    r"(maximum context length|tokens|context length exceeded)", re.I
)
_FILTER_RESULT_KEY = ("error", "innererror", "content_filter_result")

FILTER_REASON_DICT = {
    "hate": "差別",
    "self_harm": "自傷行為",
    "sexual": "性的",
    "violence": "暴力",
    "jailbreak": "システム不正行為",
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

        # BadRequestError は内容を見て仕分け
        if isinstance(err, BadRequestError):
            raw_msg = str(err)
            # 1) トークン超過
            if _TOKEN_OVERRUN_RE.search(raw_msg):
                return "E_B2_00020", ErrorCode.BAD_REQUEST, {"value": "メッセージ"}

            # 2) コンテンツフィルタ
            details = cls._try_extract_json(raw_msg)
            if isinstance(details, dict):
                # content_filter_result の有無
                cfr = details
                for key in _FILTER_RESULT_KEY:
                    cfr = cfr.get(key) if isinstance(cfr, dict) else None
                if cfr:
                    filter_reasons = [
                        FILTER_REASON_DICT.get(k, k)
                        for k, v in cfr.items()
                        if v.get("filtered")
                    ]
                    if filter_reasons:
                        return (
                            "E_B2_00090",
                            ErrorCode.BAD_REQUEST,
                            {"filter_reasons": ", ".join(filter_reasons)},
                        )
                    return "E_B2_00100", ErrorCode.BAD_REQUEST, {}
            # 3) それ以外
            return "E_B2_00110", ErrorCode.BAD_REQUEST, {}

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

    @classmethod
    def _file_table(cls, extension: str) -> tuple[str, ErrorCode, dict[str, Any]]:
        if extension == "msg":
            return (
                "E_B2_00120",
                ErrorCode.BAD_REQUEST,
                {"value": "メッセージ"},
            )
        else:
            return (
                "E_B2_00130",
                ErrorCode.BAD_REQUEST,
                {"value": "メッセージ"},
            )

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
            exc_info=err,  # スタックトレースを含む詳細情報を出力
        )
        return error_response, http_status.value


# ------------------ Decorators ------------------ #
def azure_function_error_handler(
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

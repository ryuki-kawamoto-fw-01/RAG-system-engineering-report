import json
import logging
import traceback
from datetime import UTC, datetime
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, Tuple, Type

import azure.functions as azure_func
from modules.logging.constants import LogTag, TAG_GROUPS
from openai._exceptions import APIError, BadRequestError, OpenAIError, RateLimitError


class ErrorCode(Enum):
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    RATE_LIMIT = 429
    INTERNAL_ERROR = 500
    SERVICE_UNAVAILABLE = 503


class ErrorHandler:
    ERROR_MAPPING: Dict[Type[Exception], Tuple[str, ErrorCode]] = {
        OpenAIError: (
            "生成AIサービスで問題が発生しました。少し時間を置いてから再度お試しください。それでも解決しない場合は、システム管理者にお問い合わせください。",
            ErrorCode.SERVICE_UNAVAILABLE,
        ),
        RateLimitError: (
            "生成AIサービスの利用が集中しているため、一時的に利用が制限されています。少し時間を置いてから再度お試しください。",
            ErrorCode.RATE_LIMIT,
        ),
        APIError: (
            "生成AIサービスに接続できませんでした。少し時間を置いてから再度お試しください。それでも解決しない場合は、システム管理者にお問い合わせください。",
            ErrorCode.SERVICE_UNAVAILABLE,
        ),
        BadRequestError: (
            "送信したメッセージの処理に問題が発生しました。システム管理者にお問い合わせください。",
            ErrorCode.BAD_REQUEST,
        ),
        ValueError: (
            "システム内部の入力値に誤りがあります。システム管理者にお問い合わせください。",
            ErrorCode.BAD_REQUEST,
        ),
        KeyError: (
            "システム内部の必要な情報が不足しています。システム管理者にお問い合わせください。",
            ErrorCode.BAD_REQUEST,
        ),
        Exception: (
            "予期しない問題が発生しました。少し時間を置いてから再度お試しください。それでも解決しない場合は、システム管理者にお問い合わせください。",
            ErrorCode.INTERNAL_ERROR,
        ),
    }

    FILTER_REASON_DICT = {
        "hate": "差別",
        "self_harm": "自傷行為",
        "sexual": "性的",
        "violence": "暴力",
        "jailbreak": "システム不正行為",
    }

    @classmethod
    def _get_error_tags(cls, error_type: Type[Exception]) -> list[str]:
        """エラータイプに基づいて適切なログタグを返します"""
        if issubclass(error_type, OpenAIError):
            return TAG_GROUPS["CHAT"]
        elif issubclass(error_type, ValueError):
            return [LogTag.TEXT.value]
        return [LogTag.TEXT.value]  # デフォルトタグ

    @classmethod
    def handle_error(cls, error: Exception) -> Tuple[Dict[str, Any], int]:
        """エラーを処理し、適切なレスポンス形式とステータスコードを返します"""
        error_type = type(error)
        error_message, error_code = cls.ERROR_MAPPING.get(
            error_type, cls.ERROR_MAPPING[Exception]
        )

        if error_code == ErrorCode.BAD_REQUEST and isinstance(error, BadRequestError):
            error_details = error.args[0]
            if isinstance(error_details, str):
                try:
                    # `error_details`に例外プレフィックスが含まれているため、それを除外してから辞書に変換
                    if "-" in error_details:
                        error_details = error_details.split(" - ", 1)[1]
                    error_details = eval(error_details)
                except (SyntaxError, NameError, IndexError):
                    error_details = {}

            if isinstance(
                error_details, dict
            ) and "content_filter_result" in error_details.get("error", {}).get(
                "innererror", {}
            ):
                content_filter_result = error_details["error"]["innererror"][
                    "content_filter_result"
                ]
                filter_reasons = []
                for key, value in content_filter_result.items():
                    if value["filtered"]:
                        # ユーザーが理解しやすいメッセージに変換
                        reason_description = cls.FILTER_REASON_DICT.get(key, key)
                        filter_reasons.append(reason_description)

                if filter_reasons:
                    detailed_message = f"送信したメッセージがポリシーに違反しました。「{', '.join(filter_reasons)}」を助長する内容は許可されていません。"
                else:
                    detailed_message = "送信したメッセージがポリシーに違反しましたが、具体的な理由は提供されていません。"
            else:
                detailed_message = "送信したメッセージがポリシーに違反しましたが、詳細な情報は取得出来ませんでした。"

            error_response = {
                "error": detailed_message,
                "status_code": error_code.value,
                "log_details": {
                    "error_type": error_type.__name__,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "tags": cls._get_error_tags(error_type),
                },
            }
        elif error_code == ErrorCode.RATE_LIMIT and isinstance(error, RateLimitError):
            error_response = {
                "error": error_message,
                "status_code": error_code.value,
                "log_details": {
                    "error_type": error_type.__name__,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "tags": cls._get_error_tags(error_type),
                },
            }
        else:
            error_response = {
                "error": error_message,
                "status_code": error_code.value,
                "log_details": {
                    "error_type": error_type.__name__,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "tags": cls._get_error_tags(error_type),
                },
            }

        # エラーをログに記録
        logging.error(
            f"Error occurred: {error_message}",
            extra={
                "error_type": error_type.__name__,
                "tags": cls._get_error_tags(error_type),
            },
        )

        return error_response, error_code.value


def error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable[[azure_func.HttpRequest], azure_func.HttpResponse]:
    """エラーハンドリングデコレータ"""

    def wrapper(*args: Any, **kwargs: Any) -> azure_func.HttpResponse:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            error_response, status_code = ErrorHandler.handle_error(e)
            traceback.print_exc()
            return azure_func.HttpResponse(
                json.dumps(error_response),
                status_code=status_code,
                mimetype="application/json",
            )

    return wrapper


def azure_function_error_handler(
    func: Callable[[azure_func.HttpRequest], azure_func.HttpResponse],
) -> Callable[[azure_func.HttpRequest], azure_func.HttpResponse]:
    @wraps(func)
    def wrapper(req: azure_func.HttpRequest) -> azure_func.HttpResponse:
        try:
            return func(req)
        except Exception as e:
            logging.error(f"Error: {e}", exc_info=True)  # 詳細なエラーログを出力
            error_data, status_code = ErrorHandler.handle_error(e)
            traceback.print_exc()
            error_response = {
                "success": False,
                "data": error_data,
            }
            return azure_func.HttpResponse(
                json.dumps(error_response),
                status_code=status_code,
                mimetype="application/json",
            )

    return wrapper

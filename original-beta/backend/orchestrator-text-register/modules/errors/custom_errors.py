# -*- coding: utf-8 -*-
"""
アプリ固有のカスタム例外
"""
from __future__ import annotations

from typing import Any


class LLMSpecificError(Exception):
    """
    独自エラー。ERROR_ID とプレースホルダー埋め込み用の kwargs を保持するだけ。
    """

    def __init__(self, error_id: str, **fmt_kwargs: Any) -> None:
        self.error_id = error_id
        self.fmt_kwargs = fmt_kwargs
        super().__init__(error_id, fmt_kwargs)

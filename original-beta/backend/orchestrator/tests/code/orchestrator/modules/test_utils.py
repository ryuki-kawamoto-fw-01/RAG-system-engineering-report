import json
import sys
from datetime import datetime
from pathlib import Path

import pytest


def _add_orchestrator_to_syspath() -> None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "backend" / "orchestrator"
        if (candidate / "function_app.py").exists():
            sys.path.insert(0, str(candidate))
            return
    raise RuntimeError("Could not locate backend/orchestrator to add to sys.path")


_add_orchestrator_to_syspath()

import modules.utils as target  # noqa: E402


def test_get_current_date_time_format(monkeypatch: pytest.MonkeyPatch):
    # N-01-001
    class _FixedDatetime:
        @staticmethod
        def now():
            return datetime(2026, 3, 6, 12, 34, 56)

    monkeypatch.setattr(target, "datetime", _FixedDatetime)

    assert target.get_current_date_time() == "2026年03月06日 12時"


def test_get_current_date_time_zero_pads_month_day_hour(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    class _FixedDatetime:
        @staticmethod
        def now():
            return datetime(2026, 1, 2, 3, 4, 5)

    monkeypatch.setattr(target, "datetime", _FixedDatetime)
    assert target.get_current_date_time() == "2026年01月02日 03時"


def test_success_response_json_shape():
    # N-01-002
    resp = target.success_response({"a": 1})
    assert resp.status_code == 200
    assert resp.mimetype == "application/json"
    assert json.loads(resp.get_body()) == {"a": 1}


def test_success_response_handles_list_and_japanese_text():
    # I-01-001
    resp = target.success_response(["あ", "い"])  # ensure_ascii=False
    assert json.loads(resp.get_body()) == ["あ", "い"]


def test_error_response_json_shape():
    # E-01-001
    resp = target.error_response("nope", status_code=404)
    assert resp.status_code == 404
    assert resp.mimetype == "application/json"
    assert json.loads(resp.get_body()) == {"success": False, "message": "nope"}


def test_error_response_default_status_code_is_500():
    # E-01-002
    resp = target.error_response("x")
    assert resp.status_code == 500

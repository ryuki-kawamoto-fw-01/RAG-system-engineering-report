import sys
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

import modules.prompts.system as target  # noqa: E402
from modules.prompts.response_format import WebSearchParameters  # noqa: E402


def test_system_message_contains_intro():
    # N-01-001
    assert "優秀なAIアシスタント" in target.SYSTEM_MESSAGE


def test_system_message_contains_principles():
    # N-01-002
    assert "基本原則" in target.SYSTEM_MESSAGE


def test_system_message_contains_response_guidance():
    # N-01-003
    assert "応答の仕方" in target.SYSTEM_MESSAGE


def test_system_message_contains_output_format():
    # N-01-004
    assert "出力形式" in target.SYSTEM_MESSAGE


def test_system_message_has_no_current_date_placeholder():
    # L-01-001
    assert "{current_date}" not in target.SYSTEM_MESSAGE


def test_web_search_tool_type_and_name():
    # N-01-005
    assert target.WEB_SEARCH_TOOL["type"] == "function"
    assert target.WEB_SEARCH_TOOL["function"]["name"] == "web_search"


def test_web_search_tool_description_mentions_search_bing():
    # L-01-002
    assert "Search Bing" in target.WEB_SEARCH_TOOL["function"]["description"]


def test_web_search_tool_schema_matches_model():
    # I-01-001
    assert target.WEB_SEARCH_TOOL["function"]["parameters"] == (
        WebSearchParameters.model_json_schema()
    )


def test_web_search_tool_missing_key_raises():
    # E-01-001
    with pytest.raises(KeyError):
        _ = target.WEB_SEARCH_TOOL["missing"]


def test_web_search_tool_missing_nested_key_raises():
    # E-01-002
    with pytest.raises(KeyError):
        _ = target.WEB_SEARCH_TOOL["function"]["missing"]

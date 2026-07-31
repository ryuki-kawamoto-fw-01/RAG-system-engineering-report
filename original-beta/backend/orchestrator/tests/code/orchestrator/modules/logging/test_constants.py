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

import modules.logging.constants as target  # noqa: E402


def test_logtag_values_are_unique_and_non_empty():
    # N-01-001
    values = [tag.value for tag in target.LogTag]
    assert len(values) == len(set(values))
    assert all(values)


def test_logtag_contains_expected_values():
    # N-01-002
    expected = {
        "chat",
        "generation",
        "function_calling",
        "rerank",
        "tool",
        "prompts",
        "json_scheme",
        "text",
        "web_search",
        "key_variation",
        "retrieve_context",
        "rerank_search_result",
        "llm",
    }
    assert {tag.value for tag in target.LogTag} == expected


def test_tag_groups_has_expected_keys():
    # N-01-003
    assert set(target.TAG_GROUPS.keys()) == {
        "CHAT",
        "WEB_SEARCH",
        "RERANK",
        "KEYWORD_VARIATION",
        "RETRIEVE_CONTEXT",
        "RERANK_SEARCH_RESULT",
        "CREATE_SEARCH_KEYWORD_VARIATION_PROMPT",
    }


def test_tag_groups_values_are_logtag_values():
    # E-01-001
    all_tag_values = {tag.value for tag in target.LogTag}
    for group_values in target.TAG_GROUPS.values():
        assert all(value in all_tag_values for value in group_values)


def test_logtag_rejects_unknown_value():
    # E-01-002
    with pytest.raises(ValueError):
        _ = target.LogTag("unknown")


def test_tag_groups_chat_order_matches_expected():
    # L-01-001
    assert target.TAG_GROUPS["CHAT"] == [
        target.LogTag.CHAT.value,
        target.LogTag.GENERATION.value,
        target.LogTag.TEXT.value,
        target.LogTag.FUNCTION_CALLING.value,
        target.LogTag.LLM.value,
    ]


def test_tag_groups_rerank_contains_json_scheme():
    # L-01-002
    assert target.LogTag.JSON_SCHEME.value in target.TAG_GROUPS["RERANK"]


def test_tag_groups_create_search_keyword_variation_prompt_contains_prompts():
    # I-01-001
    assert target.LogTag.PROMPTS.value in target.TAG_GROUPS[
        "CREATE_SEARCH_KEYWORD_VARIATION_PROMPT"
    ]


def test_tag_groups_have_no_empty_group():
    # I-01-002
    assert all(len(values) > 0 for values in target.TAG_GROUPS.values())

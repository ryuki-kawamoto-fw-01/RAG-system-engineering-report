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

import modules.prompts.context_retriever as target  # noqa: E402


def test_prompt_formats_values():
    # N-01-001
    text = target.CONTEXT_RETRIEVER_PROMPT.format(
        chat_history="h", question="q", current_date_time="t"
    )
    assert "対話履歴: h" in text
    assert "質問: q" in text
    assert "現在の時間: t" in text


def test_prompt_contains_info_type_section():
    # N-01-002
    text = target.CONTEXT_RETRIEVER_PROMPT.format(
        chat_history="h", question="q", current_date_time="t"
    )
    assert "情報タイプの選定" in text


def test_prompt_contains_output_format():
    # N-01-003
    text = target.CONTEXT_RETRIEVER_PROMPT.format(
        chat_history="h", question="q", current_date_time="t"
    )
    assert "Output Format" in text


def test_prompt_formats_empty_chat_history():
    # L-01-001
    text = target.CONTEXT_RETRIEVER_PROMPT.format(
        chat_history="", question="q", current_date_time="t"
    )
    assert "対話履歴: " in text


def test_prompt_formats_empty_question():
    # L-01-002
    text = target.CONTEXT_RETRIEVER_PROMPT.format(
        chat_history="h", question="", current_date_time="t"
    )
    assert "質問: " in text


def test_prompt_format_missing_question_raises():
    # E-01-001
    with pytest.raises(KeyError):
        _ = target.CONTEXT_RETRIEVER_PROMPT.format(
            chat_history="h", current_date_time="t"
        )


def test_prompt_format_missing_time_raises():
    # E-01-002
    with pytest.raises(KeyError):
        _ = target.CONTEXT_RETRIEVER_PROMPT.format(
            chat_history="h", question="q"
        )


def test_prompt_formats_multiline_history():
    # I-01-001
    text = target.CONTEXT_RETRIEVER_PROMPT.format(
        chat_history="user: a\nassistant: b",
        question="q",
        current_date_time="t",
    )
    assert "user: a" in text
    assert "assistant: b" in text

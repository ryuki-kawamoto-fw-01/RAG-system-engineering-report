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

import modules.prompts.keyword_variation as target  # noqa: E402


def test_prompt_includes_hold_keywords_condition(monkeypatch):
    # N-01-001
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    text = target.create_search_keyword_variation_prompt(
        question="q",
        chat_history=[{"role": "user", "content": "hi"}],
        context_info="c",
        hold_keywords=True,
    )
    assert "ユーザーの検索クエリを必ず含めてください" in text


def test_prompt_excludes_hold_keywords_condition(monkeypatch):
    # L-01-001
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    text = target.create_search_keyword_variation_prompt(
        question="q",
        chat_history=[{"role": "user", "content": "hi"}],
        context_info="c",
        hold_keywords=False,
    )
    assert "ユーザーの検索クエリを必ず含めてください" not in text


def test_prompt_includes_question_and_context(monkeypatch):
    # N-01-002
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    text = target.create_search_keyword_variation_prompt(
        question="qq",
        chat_history=[{"role": "user", "content": "hi"}],
        context_info="ctx",
    )
    assert "ユーザーの検索クエリ: qq" in text
    assert "コンテキスト情報: ctx" in text


def test_prompt_formats_chat_history(monkeypatch):
    # N-01-003
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    text = target.create_search_keyword_variation_prompt(
        question="q",
        chat_history=[
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "ok"},
        ],
        context_info="c",
    )
    assert "user: hi" in text
    assert "assistant: ok" in text


def test_prompt_includes_output_format(monkeypatch):
    # N-01-004
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    text = target.create_search_keyword_variation_prompt(
        question="q",
        chat_history=[],
        context_info="c",
    )
    assert "Output Format" in text
    assert "\"keywords\"" in text


def test_prompt_formats_empty_history(monkeypatch):
    # L-01-002
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    text = target.create_search_keyword_variation_prompt(
        question="q",
        chat_history=[],
        context_info="c",
    )
    assert "2. 会話の履歴: " in text


def test_prompt_missing_content_key_raises(monkeypatch):
    # E-01-001
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    with pytest.raises(KeyError):
        target.create_search_keyword_variation_prompt(
            question="q",
            chat_history=[{"role": "user"}],
            context_info="c",
        )


def test_prompt_missing_role_key_raises(monkeypatch):
    # E-01-002
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    with pytest.raises(KeyError):
        target.create_search_keyword_variation_prompt(
            question="q",
            chat_history=[{"content": "hi"}],
            context_info="c",
        )


def test_prompt_uses_current_date_time_multiple_times(monkeypatch):
    # I-01-001
    calls = {"count": 0}

    def _now():
        calls["count"] += 1
        return "NOW"

    monkeypatch.setattr(target, "get_current_date_time", _now)
    text = target.create_search_keyword_variation_prompt(
        question="q",
        chat_history=[{"role": "user", "content": "hi"}],
        context_info="c",
    )
    assert calls["count"] == 3
    assert text.count("NOW") == 3

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

import modules.prompts.rerank_search_result as target  # noqa: E402


def test_rerank_prompt_includes_question():
    # N-01-001
    text = target.create_rerank_search_results_prompt(
        question="q", context_info="c", search_results="r"
    )
    assert "質問: q" in text


def test_rerank_prompt_includes_context_and_results():
    # N-01-002
    text = target.create_rerank_search_results_prompt(
        question="q", context_info="ctx", search_results="results"
    )
    assert "ctx" in text
    assert "results" in text


def test_rerank_prompt_includes_output_format():
    # N-01-003
    text = target.create_rerank_search_results_prompt(
        question="q", context_info="c", search_results="r"
    )
    assert "rankedResults" in text


def test_rerank_prompt_includes_score_and_rank():
    # N-01-004
    text = target.create_rerank_search_results_prompt(
        question="q", context_info="c", search_results="r"
    )
    assert "score" in text
    assert "rank" in text


def test_rerank_prompt_minimal_input():
    # L-01-001
    text = target.create_rerank_search_results_prompt(
        question="x", context_info="c", search_results="y"
    )
    assert isinstance(text, str)


def test_rerank_prompt_allows_whitespace_results():
    # L-01-002
    text = target.create_rerank_search_results_prompt(
        question="q", context_info="c", search_results=" "
    )
    assert isinstance(text, str)


def test_rerank_prompt_empty_question_raises():
    # E-01-001
    with pytest.raises(ValueError):
        target.create_rerank_search_results_prompt(
            question="", context_info="c", search_results="r"
        )


def test_rerank_prompt_empty_results_raises():
    # E-01-002
    with pytest.raises(ValueError):
        target.create_rerank_search_results_prompt(
            question="q", context_info="c", search_results=""
        )


def test_rerank_prompt_both_empty_raises():
    # E-01-003
    with pytest.raises(ValueError):
        target.create_rerank_search_results_prompt(
            question="", context_info="c", search_results=""
        )


def test_rerank_prompt_uses_current_date_time(monkeypatch):
    # I-01-001
    calls = {"count": 0}

    def _now():
        calls["count"] += 1
        return "NOW"

    monkeypatch.setattr(target, "get_current_date_time", _now)
    text = target.create_rerank_search_results_prompt(
        question="q", context_info="c", search_results="r"
    )
    assert calls["count"] == 2
    assert text.count("NOW") == 2


def test_rerank_prompt_includes_current_date_line(monkeypatch):
    # I-01-002
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    text = target.create_rerank_search_results_prompt(
        question="q", context_info="c", search_results="r"
    )
    assert "現在の日時: NOW" in text

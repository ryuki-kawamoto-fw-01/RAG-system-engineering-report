import sys
from contextlib import contextmanager
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

import modules.context_retriever as target  # noqa: E402


class _Resp:
    class _Msg:
        def __init__(self, content):
            self.content = content

    class _Choice:
        def __init__(self, content):
            self.message = _Resp._Msg(content)

    def __init__(self, content: str):
        self.choices = [_Resp._Choice(content)]


class DummyAOAI:
    def __init__(self):
        self.calls = []

        class _Completions:
            def __init__(self, outer):
                self.outer = outer

            def create(self, **params):
                self.outer.calls.append(params)
                return _Resp("CTX")

        class _Chat:
            def __init__(self, outer):
                self.completions = _Completions(outer)

        self.chat = _Chat(self)


@contextmanager
def _dummy_trace(*args, **kwargs):
    class _Run:
        def end(self, *args, **kwargs):
            return None

    yield _Run()


def test_retrieve_context_returns_content_and_passes_reasoning_effort(monkeypatch: pytest.MonkeyPatch):
    # N-01-001
    dummy = DummyAOAI()
    monkeypatch.setattr(target, "trace", _dummy_trace)

    out = target.retrieve_context(
        aoai_client=dummy,
        deploy_name="m",
        chat_history=[{"role": "user", "content": "hi"}],
        question="q",
        current_date_time="now",
        reasoning_effort="medium",
    )

    assert out == "CTX"
    assert dummy.calls
    assert dummy.calls[0]["model"] == "m"
    assert dummy.calls[0]["reasoning_effort"] == "medium"


def test_retrieve_context_includes_reasoning_effort_key_even_when_none(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    dummy = DummyAOAI()
    monkeypatch.setattr(target, "trace", _dummy_trace)

    out = target.retrieve_context(
        aoai_client=dummy,
        deploy_name="m",
        chat_history=[],
        question="q",
        current_date_time="now",
        reasoning_effort=None,
    )

    assert out == "CTX"
    assert "reasoning_effort" in dummy.calls[0]
    assert dummy.calls[0]["reasoning_effort"] is None


def test_retrieve_context_formats_chat_history_with_non_string_content(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    dummy = DummyAOAI()
    monkeypatch.setattr(target, "trace", _dummy_trace)

    out = target.retrieve_context(
        aoai_client=dummy,
        deploy_name="m",
        chat_history=[{"role": "assistant", "content": [{"tool": "x"}]}],
        question="q",
        current_date_time="now",
    )
    assert out == "CTX"


def test_retrieve_context_formats_empty_chat_history(monkeypatch: pytest.MonkeyPatch):
    # L-01-002
    dummy = DummyAOAI()
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "CONTEXT_RETRIEVER_PROMPT", "H={chat_history}|Q={question}|T={current_date_time}")

    out = target.retrieve_context(
        aoai_client=dummy,
        deploy_name="m",
        chat_history=[],
        question="qq",
        current_date_time="NOW",
    )

    assert out == "CTX"
    msg0 = dummy.calls[0]["messages"][0]["content"]
    assert msg0 == "H=|Q=qq|T=NOW"


def test_retrieve_context_raises_key_error_when_content_missing(monkeypatch: pytest.MonkeyPatch):
    # E-01-002
    dummy = DummyAOAI()
    monkeypatch.setattr(target, "trace", _dummy_trace)

    with pytest.raises(KeyError):
        target.retrieve_context(
            aoai_client=dummy,
            deploy_name="m",
            chat_history=[{"role": "user"}],
            question="q",
            current_date_time="now",
        )


def test_retrieve_context_raises_when_content_none(monkeypatch: pytest.MonkeyPatch):
    # E-01-001
    class DummyNone(DummyAOAI):
        def __init__(self):
            super().__init__()

            class _Completions:
                def __init__(self, outer):
                    self.outer = outer

                def create(self, **params):
                    self.outer.calls.append(params)
                    return _Resp(None)  # type: ignore[arg-type]

            self.chat.completions = _Completions(self)

    dummy = DummyNone()
    monkeypatch.setattr(target, "trace", _dummy_trace)

    with pytest.raises(ValueError):
        target.retrieve_context(
            aoai_client=dummy,
            deploy_name="m",
            chat_history=[],
            question="q",
            current_date_time="now",
        )


def test_retrieve_context_uses_prompt_template(monkeypatch: pytest.MonkeyPatch):
    # I-01-002
    dummy = DummyAOAI()
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "CONTEXT_RETRIEVER_PROMPT", "H={chat_history} Q={question} T={current_date_time}")

    out = target.retrieve_context(
        aoai_client=dummy,
        deploy_name="m",
        chat_history=[{"role": "user", "content": "hi"}],
        question="qq",
        current_date_time="NOW",
    )
    assert out == "CTX"
    msg0 = dummy.calls[0]["messages"][0]["content"]
    assert "H=user: hi" in msg0
    assert "Q=qq" in msg0
    assert "T=NOW" in msg0

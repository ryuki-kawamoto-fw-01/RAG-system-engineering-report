import importlib
import json
import os
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


class _Resp:
    class _Msg:
        def __init__(self, content):
            self.content = content

    class _Choice:
        def __init__(self, content):
            self.message = _Resp._Msg(content)

    def __init__(self, content, usage=None):
        self.choices = [_Resp._Choice(content)]
        self.usage = usage


class DummyAOAI:
    def __init__(self, content: str, usage=None):
        self.content = content
        self.usage = usage

        class _Completions:
            def __init__(self, outer):
                self.outer = outer

            def create(self, **params):
                return _Resp(self.outer.content, usage=self.outer.usage)

        class _Chat:
            def __init__(self, outer):
                self.completions = _Completions(outer)

        self.chat = _Chat(self)


def test_generate_recommend_parses_json(monkeypatch: pytest.MonkeyPatch):
    # N-01-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.recommend as recommend

    importlib.reload(recommend)
    monkeypatch.setattr(recommend, "aoai_client", DummyAOAI('{"recommendations":["a","b","c"]}'))

    out = recommend.generate_recommend([{"role": "user", "content": "hi"}])
    assert out == ["a", "b", "c"]


def test_generate_recommend_returns_empty_on_json_decode_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.recommend as recommend

    importlib.reload(recommend)
    monkeypatch.setattr(recommend, "aoai_client", DummyAOAI("not-json"))

    out = recommend.generate_recommend([{"role": "user", "content": "hi"}])
    assert out == []


def test_generate_recommend_returns_empty_when_content_none(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.recommend as recommend

    importlib.reload(recommend)
    monkeypatch.setattr(recommend, "aoai_client", DummyAOAI(None))  # type: ignore[arg-type]

    out = recommend.generate_recommend([{"role": "user", "content": "hi"}])
    assert out == []


def test_generate_recommend_returns_empty_when_key_missing(monkeypatch: pytest.MonkeyPatch):
    # L-01-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.recommend as recommend

    importlib.reload(recommend)
    monkeypatch.setattr(recommend, "aoai_client", DummyAOAI('{"other": ["a"]}'))

    out = recommend.generate_recommend([{"role": "user", "content": "hi"}])
    assert out == []


def test_generate_recommend_returns_empty_on_client_exception(monkeypatch: pytest.MonkeyPatch):
    # E-01-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.recommend as recommend

    importlib.reload(recommend)

    class _Boom:
        class chat:
            class completions:
                @staticmethod
                def create(**params):
                    raise RuntimeError("boom")

    monkeypatch.setattr(recommend, "aoai_client", _Boom())
    out = recommend.generate_recommend([{"role": "user", "content": "hi"}])
    assert out == []


def test_generate_recommend_integration_builds_messages(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.recommend as recommend

    importlib.reload(recommend)

    calls = {}

    class _Spy:
        class chat:
            class completions:
                @staticmethod
                def create(**params):
                    calls["params"] = params
                    return _Resp('{"recommendations": ["a", "b", "c"]}')

    monkeypatch.setattr(recommend, "aoai_client", _Spy())

    out = recommend.generate_recommend([{"role": "user", "content": "hi"}])
    assert out == ["a", "b", "c"]
    assert calls["params"]["response_format"] == {"type": "json_object"}
    assert calls["params"]["messages"][0]["role"] == "system"


def test_generate_thread_title_returns_tuple_and_tokens(monkeypatch: pytest.MonkeyPatch):
    # N-01-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)

    class _Usage:
        prompt_tokens = 1
        completion_tokens = 2

    monkeypatch.setattr(title, "aoai_client", DummyAOAI("TITLE", usage=_Usage()))

    thread_title, input_tokens, output_tokens, rt = title.generate_thread_title([{"role": "user", "content": "hi"}])
    assert thread_title == "TITLE"
    assert input_tokens == 1
    assert output_tokens == 2
    assert isinstance(rt, float)


def test_generate_thread_title_usage_none_keeps_tokens_zero(monkeypatch: pytest.MonkeyPatch):
    # L-01-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)
    monkeypatch.setattr(title, "aoai_client", DummyAOAI("TITLE", usage=None))

    thread_title, input_tokens, output_tokens, _ = title.generate_thread_title([{"role": "user", "content": "hi"}])
    assert thread_title == "TITLE"
    assert input_tokens == 0
    assert output_tokens == 0


def test_generate_thread_title_returns_title_with_two_messages(monkeypatch: pytest.MonkeyPatch):
    # N-01-004
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)
    monkeypatch.setattr(title, "aoai_client", DummyAOAI("TITLE"))

    thread_title, input_tokens, output_tokens, _ = title.generate_thread_title(
        [
            {"role": "user", "content": "a"},
            {"role": "assistant", "content": "b"},
        ]
    )
    assert thread_title == "TITLE"
    assert input_tokens == 0
    assert output_tokens == 0


def test_generate_thread_title_handles_client_exception(monkeypatch: pytest.MonkeyPatch):
    # E-01-003
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)

    class _Boom:
        class chat:
            class completions:
                @staticmethod
                def create(**params):
                    raise RuntimeError("boom")

    monkeypatch.setattr(title, "aoai_client", _Boom())
    thread_title, input_tokens, output_tokens, rt = title.generate_thread_title([{"role": "user", "content": "hi"}])
    assert thread_title is None
    assert input_tokens == 0
    assert output_tokens == 0
    assert isinstance(rt, float)


def test_generate_thread_title_skips_when_history_long(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)
    monkeypatch.setattr(title, "aoai_client", DummyAOAI("TITLE"))

    thread_title, input_tokens, output_tokens, _ = title.generate_thread_title(
        [
            {"role": "user", "content": "a"},
            {"role": "assistant", "content": "b"},
            {"role": "user", "content": "c"},
        ]
    )
    assert thread_title is None
    assert input_tokens == 0
    assert output_tokens == 0


def test_generate_thread_title_content_none_returns_none(monkeypatch: pytest.MonkeyPatch):
    # L-01-003
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)
    monkeypatch.setattr(title, "aoai_client", DummyAOAI(None))  # type: ignore[arg-type]

    thread_title, input_tokens, output_tokens, _ = title.generate_thread_title(
        [{"role": "user", "content": "hi"}]
    )
    assert thread_title is None
    assert input_tokens == 0
    assert output_tokens == 0


def test_generate_thread_title_empty_history_returns_title(monkeypatch: pytest.MonkeyPatch):
    # L-01-004
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)
    monkeypatch.setattr(title, "aoai_client", DummyAOAI("TITLE"))

    thread_title, input_tokens, output_tokens, _ = title.generate_thread_title([])
    assert thread_title == "TITLE"
    assert input_tokens == 0
    assert output_tokens == 0


def test_generate_thread_title_long_history_does_not_call_client(monkeypatch: pytest.MonkeyPatch):
    # I-01-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)

    calls = {"count": 0}

    class _Spy:
        class chat:
            class completions:
                @staticmethod
                def create(**params):
                    calls["count"] += 1
                    return _Resp("TITLE")

    monkeypatch.setattr(title, "aoai_client", _Spy())

    _ = title.generate_thread_title(
        [
            {"role": "user", "content": "a"},
            {"role": "assistant", "content": "b"},
            {"role": "user", "content": "c"},
            {"role": "assistant", "content": "d"},
        ]
    )
    assert calls["count"] == 0


def test_generate_thread_title_handles_non_serializable_history(monkeypatch: pytest.MonkeyPatch):
    # E-01-004
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)

    calls = {"count": 0}

    class _Spy:
        class chat:
            class completions:
                @staticmethod
                def create(**params):
                    calls["count"] += 1
                    return _Resp("TITLE")

    monkeypatch.setattr(title, "aoai_client", _Spy())

    thread_title, input_tokens, output_tokens, _ = title.generate_thread_title(
        [{"role": "user", "content": {"bad": set(["x"])}}]
    )
    assert thread_title is None
    assert input_tokens == 0
    assert output_tokens == 0
    assert calls["count"] == 0


def test_generate_thread_title_integration_records_usage_when_present(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "test")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    import modules.title as title

    importlib.reload(title)

    class _Usage:
        prompt_tokens = 3
        completion_tokens = 4

    calls = {}

    class _Spy:
        class chat:
            class completions:
                @staticmethod
                def create(**params):
                    calls["params"] = params
                    return _Resp("TITLE", usage=_Usage())

    monkeypatch.setattr(title, "aoai_client", _Spy())

    thread_title, input_tokens, output_tokens, _ = title.generate_thread_title(
        [{"role": "user", "content": "hi"}]
    )
    assert thread_title == "TITLE"
    assert input_tokens == 3
    assert output_tokens == 4
    assert calls["params"]["messages"][0]["role"] == "system"

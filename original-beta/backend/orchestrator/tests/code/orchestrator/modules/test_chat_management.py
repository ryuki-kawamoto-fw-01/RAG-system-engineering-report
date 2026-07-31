import json
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

import modules.chat_management as target  # noqa: E402


class _TraceRun:
    def output(self, *args, **kwargs):
        return None

    def end(self, *args, **kwargs):
        return None


class _Trace:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

    def __enter__(self):
        return _TraceRun()

    def __exit__(self, exc_type, exc, tb):
        return False


class _Fn:
    def __init__(self, name: str, arguments: str):
        self.name = name
        self.arguments = arguments


class _ToolCall:
    def __init__(self, id_: str, name: str, arguments: str):
        self.id = id_
        self.function = _Fn(name, arguments)


class _Msg:
    def __init__(self, *, role: str = "assistant", content: str | None = None, tool_calls=None):
        self.role = role
        self.content = content
        self.tool_calls = tool_calls


class _Choice:
    def __init__(self, message):
        self.message = message


class _Resp:
    def __init__(self, message):
        self.choices = [_Choice(message)]


class _AOAI:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = []

        class _Completions:
            def __init__(self, outer):
                self.outer = outer

            def create(self, **params):
                self.outer.calls.append(params)
                if not self.outer._responses:
                    raise AssertionError("No more stubbed AOAI responses")
                return self.outer._responses.pop(0)

        class _Chat:
            def __init__(self, outer):
                self.completions = _Completions(outer)

        self.chat = _Chat(self)


class _ToolFn:
    def __init__(self, arguments: str):
        self.arguments = arguments


class _ToolCallArg:
    def __init__(self, arguments: str):
        self.function = _ToolFn(arguments)


class _KWResp:
    def __init__(self, *, keywords):
        self.keywords = [type("_K", (), {"keyword": k["keyword"]}) for k in keywords]


class _RerankResp:
    def __init__(self, *, results):
        self._results = results

    def format_search_result(self):
        return self._results


def test_chat_management_appends_content_when_no_tool_calls():
    # N-01-001
    history = []
    resp = _Resp(_Msg(content="hello", tool_calls=None))

    result, updated = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert result is None
    assert updated[-1] == {"role": "assistant", "content": "hello"}


def test_chat_management_appends_content_when_tool_calls_present_but_not_web_search():
    # N-01-002
    history = []
    resp = _Resp(_Msg(content="y", tool_calls=[_ToolCall("id3", "not_web_search", "{}")]))

    result, updated = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert result is None
    assert updated[-1] == {"role": "assistant", "content": "y"}


def test_chat_management_does_nothing_when_tool_calls_present_and_content_none_and_not_web_search():
    # L-01-001
    history = []
    resp = _Resp(_Msg(content=None, tool_calls=[_ToolCall("id2", "not_web_search", "{}")]))

    result, updated = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert result is None
    assert updated == []


def test_chat_management_appends_content_when_tool_calls_none():
    # I-01-002
    history = []
    resp = _Resp(_Msg(content="x", tool_calls=None))

    result, updated = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert result is None
    assert len(updated) == 1


def test_chat_management_appends_content_when_tool_calls_empty_list():
    # N-01-004
    history = []
    resp = _Resp(_Msg(content="hello", tool_calls=[]))

    result, updated = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert result is None
    assert updated[-1] == {"role": "assistant", "content": "hello"}


def test_chat_management_returns_none_when_no_tool_calls_and_no_content():
    # L-01-003
    history = []
    resp = _Resp(_Msg(content=None, tool_calls=None))

    result, updated = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert result is None
    assert updated == []


def test_chat_management_handles_web_search_tool_call(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    history = []
    tc = _ToolCall("id1", "web_search", "{\"query\":\"x\"}")
    resp = _Resp(_Msg(content=None, tool_calls=[tc]))

    monkeypatch.setattr(target, "web_search", lambda *a, **k: {"id": 1})

    out = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert isinstance(out, list)
    result, updated = out
    assert result == {"id": 1}
    assert updated[0]["role"] == "assistant"
    assert updated[0]["tool_calls"][0]["id"] == "id1"
    assert updated[1]["role"] == "tool"
    assert updated[1]["tool_call_id"] == "id1"


def test_chat_management_uses_web_search_when_multiple_tool_calls(monkeypatch: pytest.MonkeyPatch):
    # I-01-004
    history = []
    tc1 = _ToolCall("id1", "not_web_search", "{}")
    tc2 = _ToolCall("id2", "web_search", "{\"query\":\"x\"}")
    resp = _Resp(_Msg(content=None, tool_calls=[tc1, tc2]))

    called = {}

    def _fake_web_search(*args, **kwargs):
        called["args"] = args
        called["kwargs"] = kwargs
        return [{"id": 2}]

    monkeypatch.setattr(target, "web_search", _fake_web_search)

    result, updated = target.chat_management(
        aoai_client=None,  # type: ignore[arg-type]
        response=resp,  # type: ignore[arg-type]
        chat_history=history,
        deploy_name="m",
        question="q",
    )

    assert result == [{"id": 2}]
    assert updated[0]["tool_calls"][0]["id"] == "id2"
    assert "args" in called


def test_chat_management_propagates_web_search_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-003
    history = []
    tc = _ToolCall("id4", "web_search", "{}")
    resp = _Resp(_Msg(content=None, tool_calls=[tc]))

    def _boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(target, "web_search", _boom)

    with pytest.raises(RuntimeError, match="boom"):
        target.chat_management(
            aoai_client=None,  # type: ignore[arg-type]
            response=resp,  # type: ignore[arg-type]
            chat_history=history,
            deploy_name="m",
            question="q",
        )


def _make_tool_calls_response(arguments: str):
    return _Resp(_Msg(content=None, tool_calls=[_ToolCall("tc", "fn", arguments)]))


def test_web_search_returns_none_when_keyword_tool_calls_missing(monkeypatch: pytest.MonkeyPatch):
    # N-01-003
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "create_rerank_search_results_prompt", lambda **k: "P2")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})
    monkeypatch.setattr(target, "RERANK_FUNCTION", {"name": "rr"})

    class _MsgNoTool:
        tool_calls = None

    class _ChoiceNoTool:
        message = _MsgNoTool()

    class _RespNoTool:
        choices = [_ChoiceNoTool()]

    aoai = _AOAI([_RespNoTool()])
    out = target.web_search(aoai, "q", [], "m")
    assert out is None


def test_web_search_happy_path_returns_formatted_search_results(monkeypatch: pytest.MonkeyPatch):
    # I-01-003
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "create_rerank_search_results_prompt", lambda **k: "P2")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})
    monkeypatch.setattr(target, "RERANK_FUNCTION", {"name": "rr"})
    monkeypatch.setattr(target, "KeywordVariationResponse", _KWResp)
    monkeypatch.setattr(target, "RerankResponse", _RerankResp)

    monkeypatch.setattr(target, "retireve_search_results_async", lambda **k: "SR")

    kw_resp = _make_tool_calls_response('{"keywords":[{"keyword":"a"},{"keyword":"b"}]}')
    rr_resp = _make_tool_calls_response('{"results":[{"id":1,"title":"t","url":"u","snippet":"s"}]}')
    aoai = _AOAI([kw_resp, rr_resp])

    out = target.web_search(aoai, "q", [{"role": "user", "content": "hi"}], "m", reasoning_effort="low")
    assert out == [{"id": 1, "title": "t", "url": "u", "snippet": "s"}]

    assert len(aoai.calls) == 2
    assert aoai.calls[0]["model"] == "m"
    assert "reasoning_effort" in aoai.calls[0]
    assert aoai.calls[1]["model"] == "m"


def test_web_search_includes_reasoning_effort_key_when_none(monkeypatch: pytest.MonkeyPatch):
    # N-01-005
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "create_rerank_search_results_prompt", lambda **k: "P2")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})
    monkeypatch.setattr(target, "RERANK_FUNCTION", {"name": "rr"})
    monkeypatch.setattr(target, "KeywordVariationResponse", _KWResp)
    monkeypatch.setattr(target, "RerankResponse", _RerankResp)
    monkeypatch.setattr(target, "retireve_search_results_async", lambda **k: "SR")

    kw_resp = _make_tool_calls_response('{"keywords":[{"keyword":"a"}]}')
    rr_resp = _make_tool_calls_response('{"results":[{"id":1,"title":"t","url":"u","snippet":"s"}]}')
    aoai = _AOAI([kw_resp, rr_resp])

    out = target.web_search(aoai, "q", [], "m")
    assert out == [{"id": 1, "title": "t", "url": "u", "snippet": "s"}]
    assert aoai.calls[0]["reasoning_effort"] is None
    assert aoai.calls[1]["reasoning_effort"] is None


def test_web_search_empty_keywords_list_still_reranks(monkeypatch: pytest.MonkeyPatch):
    # L-01-004
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "create_rerank_search_results_prompt", lambda **k: "P2")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})
    monkeypatch.setattr(target, "RERANK_FUNCTION", {"name": "rr"})
    monkeypatch.setattr(target, "KeywordVariationResponse", lambda **k: _KWResp(keywords=[]))
    monkeypatch.setattr(target, "RerankResponse", _RerankResp)

    captured = {}

    def _fake_search(**kwargs):
        captured["keywords_list"] = kwargs.get("keywords_list")
        return "SR"

    monkeypatch.setattr(target, "retireve_search_results_async", _fake_search)

    kw_resp = _make_tool_calls_response('{"keywords":[]}')
    rr_resp = _make_tool_calls_response('{"results":[{"id":9,"title":"t","url":"u","snippet":"s"}]}')
    aoai = _AOAI([kw_resp, rr_resp])

    out = target.web_search(aoai, "q", [], "m")
    assert out == [{"id": 9, "title": "t", "url": "u", "snippet": "s"}]
    assert captured["keywords_list"] == []


def test_web_search_rerank_tool_calls_missing_returns_none(monkeypatch: pytest.MonkeyPatch):
    # L-01-002
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "create_rerank_search_results_prompt", lambda **k: "P2")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})
    monkeypatch.setattr(target, "RERANK_FUNCTION", {"name": "rr"})
    monkeypatch.setattr(target, "KeywordVariationResponse", _KWResp)
    monkeypatch.setattr(target, "retireve_search_results_async", lambda **k: "SR")

    kw_resp = _make_tool_calls_response('{"keywords":[{"keyword":"a"}]}')

    class _MsgNoTool:
        tool_calls = None

    class _ChoiceNoTool:
        message = _MsgNoTool()

    class _RespNoTool:
        choices = [_ChoiceNoTool()]

    aoai = _AOAI([kw_resp, _RespNoTool()])
    out = target.web_search(aoai, "q", [], "m")
    assert out is None


def test_web_search_rerank_invalid_json_raises(monkeypatch: pytest.MonkeyPatch):
    # E-01-004
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "create_rerank_search_results_prompt", lambda **k: "P2")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})
    monkeypatch.setattr(target, "RERANK_FUNCTION", {"name": "rr"})
    monkeypatch.setattr(target, "KeywordVariationResponse", _KWResp)
    monkeypatch.setattr(target, "retireve_search_results_async", lambda **k: "SR")

    kw_resp = _make_tool_calls_response('{"keywords":[{"keyword":"a"}]}')
    rr_resp = _make_tool_calls_response("not-json")
    aoai = _AOAI([kw_resp, rr_resp])

    with pytest.raises(json.JSONDecodeError):
        target.web_search(aoai, "q", [], "m")


def test_web_search_raises_on_invalid_keyword_tool_call_json(monkeypatch: pytest.MonkeyPatch):
    # E-01-002
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})

    kw_resp = _make_tool_calls_response('not-json')
    aoai = _AOAI([kw_resp])
    with pytest.raises(json.JSONDecodeError):
        target.web_search(aoai, "q", [], "m")


def test_web_search_keyword_variation_validation_error_propagates(monkeypatch: pytest.MonkeyPatch):
    # E-01-005
    monkeypatch.setattr(target, "trace", _Trace)
    monkeypatch.setattr(target, "TAG_GROUPS", {"KEYWORD_VARIATION": ["t"], "RERANK_SEARCH_RESULT": ["t"]})
    monkeypatch.setattr(target, "retrieve_context", lambda **k: "CTX")
    monkeypatch.setattr(target, "get_current_date_time", lambda: "NOW")
    monkeypatch.setattr(target, "create_search_keyword_variation_prompt", lambda **k: "P1")
    monkeypatch.setattr(target, "VARIY_KEYWORDS_FUNCTION", {"name": "kw"})

    def _raise(*args, **kwargs):
        raise ValueError("bad schema")

    monkeypatch.setattr(target, "KeywordVariationResponse", _raise)

    kw_resp = _make_tool_calls_response('{"keywords":[{"keyword":"a"}]}')
    aoai = _AOAI([kw_resp])

    with pytest.raises(ValueError, match="bad schema"):
        target.web_search(aoai, "q", [], "m")

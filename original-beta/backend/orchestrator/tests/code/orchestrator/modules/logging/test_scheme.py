import sys
from pathlib import Path
from types import SimpleNamespace

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

import modules.logging.scheme as target  # noqa: E402


class DummyChatCompletion:
    def __init__(self, response_id: str = "resp-id", include_usage: bool = True):
        usage = None
        if include_usage:
            usage = SimpleNamespace(prompt_tokens=1, completion_tokens=2, total_tokens=3)
        self.id = response_id
        self.choices = [
            SimpleNamespace(
                message=SimpleNamespace(content="hello", role="assistant"),
                finish_reason="stop",
                index=0,
            )
        ]
        self.usage = usage
        self.model = "dummy"


def _make_context_info() -> target.ContextInfo:
    return target.ContextInfo(
        llm_name="",
        llm_type="test",
        function_name=None,
        tags=[],
        input_type="text",
        input_value="input",
        output_type="text",
        token_usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    )


def test_context_metadata_defaults_tags_empty():
    # N-01-001
    meta = target.ContextMetadata(llm_name="x", llm_type="y")
    assert meta.tags == []


def test_context_info_serializes_dict_input():
    # N-01-002
    ctx = _make_context_info()
    payload = {"a": 1}
    assert ctx.serialize_input_value(payload) == payload


def test_context_info_serializes_list_input():
    # N-01-003
    ctx = _make_context_info()
    payload = ["a", 1]
    assert ctx.serialize_input_value(payload) == payload


def test_context_info_serializes_passthrough_input():
    # N-01-004
    ctx = _make_context_info()
    assert ctx.serialize_input_value("text") == "text"


def test_context_info_serializes_empty_dict():
    # L-01-004
    ctx = _make_context_info()
    payload = {}
    assert ctx.serialize_input_value(payload) == payload


def test_context_info_as_success_plain_output():
    # N-01-005
    ctx = _make_context_info()
    success = ctx.as_success(output={"ok": True}, delay_time=0.5)
    assert success.successful is True
    assert success.output_value == {"ok": True}


def test_context_info_as_success_overrides_token_usage():
    # L-01-001
    ctx = _make_context_info()
    success = ctx.as_success(
        output="done",
        delay_time=0.1,
        token_usage={"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
    )
    assert success.token_usage["total_tokens"] == 2


def test_context_info_as_success_with_chat_completion(monkeypatch):
    # I-01-001
    monkeypatch.setattr(target, "ChatCompletion", DummyChatCompletion)
    ctx = _make_context_info()
    success = ctx.as_success(output=DummyChatCompletion(), delay_time=0.1)
    assert isinstance(success.output_value, target.ChatCompletionResponse)


def test_context_info_as_failure_returns_failure_log():
    # E-01-001
    ctx = _make_context_info()
    failure = ctx.as_failure(error=ValueError("bad"), delay_time=0.2)
    assert failure.successful is False
    assert failure.error_log.error_from == "ValueError"


def test_success_log_serializes_chat_completion_response():
    # N-01-006
    response = target.ChatCompletionResponse(
        id="id",
        choices=[{"message": {"content": "x", "role": "assistant"}}],
        model="dummy",
        usage=None,
    )
    log = target.SuccessLog(
        llm_name="",
        llm_type="",
        function_name=None,
        tags=[],
        input_type="text",
        input_value="input",
        output_type="text",
        token_usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        delay_time=0.1,
        output_value=response,
    )
    assert log.serialize_output_value(log.output_value) == response.model_dump()


def test_success_log_serializes_chat_completion(monkeypatch):
    # N-01-007
    monkeypatch.setattr(target, "ChatCompletion", DummyChatCompletion)
    log = target.SuccessLog(
        llm_name="",
        llm_type="",
        function_name=None,
        tags=[],
        input_type="text",
        input_value="input",
        output_type="text",
        token_usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        delay_time=0.1,
        output_value=DummyChatCompletion(),
    )
    serialized = log.serialize_output_value(log.output_value)
    assert isinstance(serialized, str)


def test_success_log_serializes_dict_and_list():
    # N-01-008
    log = target.SuccessLog(
        llm_name="",
        llm_type="",
        function_name=None,
        tags=[],
        input_type="text",
        input_value="input",
        output_type="text",
        token_usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        delay_time=0.1,
        output_value={"a": 1},
    )
    assert log.serialize_output_value(log.output_value) == {"a": 1}


def test_chat_completion_response_from_openai_response(monkeypatch):
    # I-01-002
    monkeypatch.setattr(target, "ChatCompletion", DummyChatCompletion)
    resp = DummyChatCompletion()
    converted = target.ChatCompletionResponse.from_openai_response(resp)
    assert converted.id == resp.id
    assert converted.usage is not None


def test_chat_completion_response_from_openai_response_without_usage(monkeypatch):
    # L-01-002
    monkeypatch.setattr(target, "ChatCompletion", DummyChatCompletion)
    resp = DummyChatCompletion(include_usage=False)
    converted = target.ChatCompletionResponse.from_openai_response(resp)
    assert converted.usage is None


def test_trace_log_defaults_without_history():
    # N-01-009
    trace_log = target.TraceLog(trace_id="t1")
    assert trace_log.chat_history is None
    assert trace_log.flow_history is None


def test_runlog_accepts_extra_fields():
    # N-01-010
    ctx = _make_context_info()
    runlog = target.RunLog(
        logId="log",
        contextLog=ctx.as_success(output="ok", delay_time=0.1),
        extra_field="extra",
    )
    assert runlog.model_dump()["extra_field"] == "extra"


def test_log_output_inherits_runlog_fields():
    # N-01-011
    ctx = _make_context_info()
    log_output = target.LogOutput(
        logId="log",
        contextLog=ctx.as_success(output="ok", delay_time=0.1),
        user_id="u",
        session_id="s",
    )
    assert log_output.user_id == "u"
    assert log_output.session_id == "s"


def test_failure_log_contains_error_log_fields():
    # E-01-002
    ctx = _make_context_info()
    failure = ctx.as_failure(error=RuntimeError("boom"), delay_time=0.1)
    assert failure.error_log.error_message == "boom"


def test_context_info_as_failure_overrides_token_usage():
    # L-01-003
    ctx = _make_context_info()
    failure = ctx.as_failure(
        error=RuntimeError("oops"),
        delay_time=0.1,
        token_usage={"prompt_tokens": 2, "completion_tokens": 3, "total_tokens": 5},
    )
    assert failure.token_usage["total_tokens"] == 5


def test_context_info_missing_required_fields_raises():
    # E-01-003
    with pytest.raises(Exception):
        _ = target.ContextInfo(
            llm_name="",
            llm_type="",
            input_type="text",
            input_value="x",
            output_type="text",
        )


def test_chat_completion_response_missing_required_fields_raises():
    # E-01-004
    with pytest.raises(Exception):
        _ = target.ChatCompletionResponse(id="id", choices=[])


def test_runlog_missing_context_log_raises():
    # E-01-005
    with pytest.raises(Exception):
        _ = target.RunLog(logId="log", contextLog=None)

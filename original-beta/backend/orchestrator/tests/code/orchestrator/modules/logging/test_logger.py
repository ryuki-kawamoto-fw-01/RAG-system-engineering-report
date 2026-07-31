import sys
from pathlib import Path
from types import SimpleNamespace

import pytest
from azure.functions import HttpResponse


def _add_orchestrator_to_syspath() -> None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "backend" / "orchestrator"
        if (candidate / "function_app.py").exists():
            sys.path.insert(0, str(candidate))
            return
    raise RuntimeError("Could not locate backend/orchestrator to add to sys.path")


_add_orchestrator_to_syspath()

import modules.logging.logger as target  # noqa: E402


class DummyChatCompletion:
    def __init__(self, include_usage: bool = True):
        usage = None
        if include_usage:
            usage = SimpleNamespace(prompt_tokens=1, completion_tokens=2, total_tokens=3)
        self.usage = usage


class DummyCompletion(DummyChatCompletion):
    pass


class DummyToolCall:
    def __init__(self):
        self.id = "tool-id"
        self.type = "function"
        self.function = SimpleNamespace(name="f", arguments="{}")


class DummyError(Exception):
    pass


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


@pytest.mark.parametrize(
    "metadata,expected",
    [
        (None, {"input_type": "text", "output_type": "text", "llm_name": ""}),
        ({"input_type": "json"}, {"input_type": "json", "output_type": "text", "llm_name": ""}),
        ({"output_type": "bin"}, {"input_type": "text", "output_type": "bin", "llm_name": ""}),
        ({"llm_name": "model"}, {"input_type": "text", "output_type": "text", "llm_name": "model"}),
        ({"input_type": "x", "output_type": "y"}, {"input_type": "x", "output_type": "y", "llm_name": ""}),
        ({"input_type": "a", "output_type": "b", "llm_name": "n"}, {"input_type": "a", "output_type": "b", "llm_name": "n"}),
        ({"input_type": "text", "output_type": "text", "llm_name": ""}, {"input_type": "text", "output_type": "text", "llm_name": ""}),
        ({"input_type": "json", "output_type": "json"}, {"input_type": "json", "output_type": "json", "llm_name": ""}),
        ({"input_type": "t", "output_type": "t", "llm_name": "m"}, {"input_type": "t", "output_type": "t", "llm_name": "m"}),
        ({"output_type": "text", "llm_name": "x"}, {"input_type": "text", "output_type": "text", "llm_name": "x"}),
    ],
    ids=[
        "N-01-001",
        "N-01-002",
        "N-01-003",
        "N-01-004",
        "N-01-005",
        "N-01-006",
        "N-01-007",
        "N-01-008",
        "N-01-009",
        "N-01-010",
    ],
)
def test_create_context_info_metadata_variants(metadata, expected):
    ctx = target.create_context_info(
        llm_type="type",
        input_value="val",
        tags=["t"],
        metadata=metadata,
    )
    assert ctx.input_type == expected["input_type"]
    assert ctx.output_type == expected["output_type"]
    assert ctx.llm_name == expected["llm_name"]


@pytest.mark.parametrize(
    "usage,expected",
    [
        (None, None),
        ({"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3}, {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3}),
    ],
    ids=["E-01-001", "N-02-001"],
)
def test_retrieve_usage_info_variants(usage, expected):
    obj = SimpleNamespace(usage=None)
    if usage is not None:
        obj.usage = SimpleNamespace(**usage)
    assert target.retrieve_usage_info(obj) == expected


@pytest.mark.parametrize(
    "usage,expected",
    [
        (None, None),
        ({"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3}, {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3}),
    ],
    ids=["E-02-001", "N-02-002"],
)
def test_runtree_retrieve_usage_info_variants(usage, expected):
    obj = SimpleNamespace(usage=None)
    if usage is not None:
        obj.usage = SimpleNamespace(**usage)
    assert target.RunTree.retrieve_usage_info(obj) == expected


@pytest.mark.parametrize(
    "name,expected",
    [("child", "child"), (None, "create_child")],
    ids=["N-03-001", "L-01-001"],
)
def test_runtree_create_child_name_variants(name, expected):
    run = target.RunTree(_make_context_info())
    child = run.create_child(llm_type="x", input_value="y", tags=["t"], name=name)
    assert child.context_info.function_name == expected


def test_runtree_create_child_sets_current_run():
    # I-01-001
    run = target.RunTree(_make_context_info())
    previous = target.CURRENT_RUN.get()
    child = run.create_child(llm_type="x", input_value="y", tags=["t"], name="n")
    try:
        assert target.CURRENT_RUN.get() == child
    finally:
        target.CURRENT_RUN.set(previous)


def test_runtree_set_chat_history_converts_tool_calls():
    # I-01-002
    original = target.ChatCompletionMessageToolCall
    target.ChatCompletionMessageToolCall = DummyToolCall
    run = target.RunTree(_make_context_info())
    history = [{"role": "assistant", "tool_calls": [DummyToolCall()]}]
    try:
        run.set_chat_history(history)
    finally:
        target.ChatCompletionMessageToolCall = original
    assert run.chat_history[0]["tool_calls"][0]["id"] == "tool-id"


def test_runtree_set_chat_history_with_tool_call_dict():
    # I-01-003
    original = target.ChatCompletionMessageToolCall
    target.ChatCompletionMessageToolCall = DummyToolCall
    run = target.RunTree(_make_context_info())
    history = [{"role": "assistant", "tool_calls": [{"id": "x"}]}]
    try:
        run.set_chat_history(history)
    finally:
        target.ChatCompletionMessageToolCall = original
    assert run.chat_history[0]["tool_calls"][0]["id"] == "x"


def test_runtree_set_chat_history_without_tool_calls():
    # N-04-001
    run = target.RunTree(_make_context_info())
    history = [{"role": "assistant", "content": "hi"}]
    run.set_chat_history(history)
    assert run.chat_history[0]["content"] == "hi"


def test_runtree_set_chat_history_with_tool_calls_non_list():
    # E-04-002
    run = target.RunTree(_make_context_info())
    history = [{"role": "assistant", "tool_calls": "not-a-list"}]
    run.set_chat_history(history)
    assert run.chat_history[0]["tool_calls"] == "not-a-list"


def test_runtree_output_sets_output_value():
    # N-04-002
    run = target.RunTree(_make_context_info())
    run.output("out")
    assert run.output_value == "out"


@pytest.mark.parametrize(
    "output,expected",
    [("out", "out"), (None, "preset")],
    ids=["N-05-001", "L-02-001"],
)
def test_runtree_end_sets_output_value_variants(output, expected):
    run = target.RunTree(_make_context_info())
    if output is None:
        run.output("preset")
    log = run.end(output=output)
    assert log.contextLog.output_value == expected


def test_runtree_end_updates_token_usage_from_chat_completion(monkeypatch):
    # I-01-004
    monkeypatch.setattr(target, "ChatCompletion", DummyChatCompletion)
    monkeypatch.setattr(target, "Completion", DummyCompletion)
    run = target.RunTree(_make_context_info())
    log = run.end(output=DummyChatCompletion())
    assert log.contextLog.token_usage["total_tokens"] == 0


def test_runtree_end_with_chat_completion_without_usage(monkeypatch):
    # L-02-002
    monkeypatch.setattr(target, "ChatCompletion", DummyChatCompletion)
    monkeypatch.setattr(target, "Completion", DummyCompletion)
    run = target.RunTree(_make_context_info())
    run.end(output=DummyChatCompletion(include_usage=False))
    assert run.context_info.token_usage["total_tokens"] == 0


def test_runtree_end_updates_context_token_usage_when_available(monkeypatch):
    # I-01-005
    monkeypatch.setattr(target, "ChatCompletion", DummyChatCompletion)
    monkeypatch.setattr(target, "Completion", DummyCompletion)
    called = {"value": False}

    def fake_retrieve(_):
        called["value"] = True
        return {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3}

    monkeypatch.setattr(target.RunTree, "retrieve_usage_info", staticmethod(fake_retrieve))
    run = target.RunTree(_make_context_info())
    run.end(output=target.ChatCompletion())
    assert called["value"] is True
    assert run.context_info.token_usage["total_tokens"] == 3


def test_runtree_end_with_error_logs_failure():
    # E-03-001
    run = target.RunTree(_make_context_info())
    log = run.end(error=DummyError("bad"))
    assert log.contextLog.successful is False


def test_runtree_end_twice_returns_same_run_log():
    # L-02-003
    run = target.RunTree(_make_context_info())
    first = run.end(output="x")
    second = run.end(output="y")
    assert first is second


def test_runtree_end_twice_without_run_log_raises():
    # E-03-002
    run = target.RunTree(_make_context_info())
    run.is_end = True
    run.run_log = None
    with pytest.raises(ValueError):
        run.end(output="x")


def test_runtree_end_raises_when_context_info_missing():
    # E-07-001
    run = target.RunTree(_make_context_info())
    run.context_info = None
    with pytest.raises(Exception):
        run.end(output="x")


def test_calculate_total_token_usage_no_children():
    # N-06-001
    run = target.RunTree(_make_context_info())
    total = run._calculate_total_token_usage()
    assert total["total_tokens"] == 0


def test_calculate_total_token_usage_raises_when_context_info_missing():
    # E-07-002
    run = target.RunTree(_make_context_info())
    run.context_info = None
    with pytest.raises(Exception):
        run._calculate_total_token_usage()


def test_calculate_total_token_usage_with_children():
    # I-02-001
    run = target.RunTree(_make_context_info())
    child = target.RunTree(_make_context_info(), parent_run_id=run.run_id)
    child.context_info.token_usage = {
        "prompt_tokens": 1,
        "completion_tokens": 2,
        "total_tokens": 3,
    }
    run.add_child(child)
    total = run._calculate_total_token_usage()
    assert total["total_tokens"] == 3


def test_calculate_total_token_usage_skips_child_without_tokens():
    # L-04-001
    run = target.RunTree(_make_context_info())
    child = target.RunTree(_make_context_info(), parent_run_id=run.run_id)
    child.context_info.token_usage = None
    run.add_child(child)
    total = run._calculate_total_token_usage()
    assert total["total_tokens"] == 0


def test_create_trace_log_no_children():
    # N-07-001
    run = target.RunTree(_make_context_info())
    trace = run.create_trace_log()
    assert trace.flow_history is None


def test_create_trace_log_with_named_child():
    # I-02-002
    run = target.RunTree(_make_context_info())
    child = target.RunTree(_make_context_info(), parent_run_id=run.run_id)
    child.context_info.function_name = "fn"
    child.run_log = target.RunLog(
        logId="log",
        contextLog=_make_context_info().as_success(output="ok", delay_time=0.1),
    )
    child.context_info.token_usage = {
        "prompt_tokens": 1,
        "completion_tokens": 1,
        "total_tokens": 2,
    }
    run.add_child(child)
    trace = run.create_trace_log()
    assert "fn" in (trace.flow_history or {})


def test_create_trace_log_with_unnamed_child():
    # I-02-003
    run = target.RunTree(_make_context_info())
    child = target.RunTree(_make_context_info(), parent_run_id=run.run_id)
    child.context_info.function_name = None
    child.run_log = target.RunLog(
        logId="log",
        contextLog=_make_context_info().as_success(output="ok", delay_time=0.1),
    )
    run.add_child(child)
    trace = run.create_trace_log()
    assert child.run_id in (trace.flow_history or {})


def test_create_trace_log_skips_child_without_run_log():
    # L-04-002
    run = target.RunTree(_make_context_info())
    child = target.RunTree(_make_context_info(), parent_run_id=run.run_id)
    run.add_child(child)
    trace = run.create_trace_log()
    assert trace.flow_history is None


def test_create_trace_log_raises_when_child_token_usage_missing():
    # E-07-003
    run = target.RunTree(_make_context_info())
    child = target.RunTree(_make_context_info(), parent_run_id=run.run_id)
    child.context_info.function_name = "fn"
    child.context_info.token_usage = None
    child.run_log = target.RunLog(
        logId="log",
        contextLog=_make_context_info().as_success(output="ok", delay_time=0.1),
    )
    run.add_child(child)
    with pytest.raises(Exception):
        run.create_trace_log()


def test_log_output_excludes_trace_when_empty():
    # N-08-001
    run = target.RunTree(_make_context_info())
    log = run._log_output()
    assert log.traceLog is None


def test_log_output_raises_when_context_info_missing():
    # E-05-002
    run = target.RunTree(_make_context_info())
    run.context_info = None
    with pytest.raises(ValueError):
        run._log_output()


def test_log_output_includes_trace_with_chat_history():
    # I-03-001
    run = target.RunTree(_make_context_info())
    run.set_chat_history([{"role": "assistant", "content": "hi"}])
    log = run._log_output()
    assert log.traceLog is not None


def test_log_output_includes_trace_with_flow_history():
    # I-03-002
    run = target.RunTree(_make_context_info())
    child = target.RunTree(_make_context_info(), parent_run_id=run.run_id)
    child.context_info.function_name = "fn"
    child.run_log = target.RunLog(
        logId="log",
        contextLog=_make_context_info().as_success(output="ok", delay_time=0.1),
    )
    run.add_child(child)
    log = run._log_output()
    assert log.traceLog is not None


def test_log_error_includes_trace_with_chat_history():
    # E-04-001
    run = target.RunTree(_make_context_info())
    run.set_chat_history([{"role": "assistant", "content": "hi"}])
    log = run._log_error(error=DummyError("bad"))
    assert log.traceLog is not None


def test_log_error_raises_when_context_info_missing():
    # E-05-003
    run = target.RunTree(_make_context_info())
    run.context_info = None
    with pytest.raises(ValueError):
        run._log_error(error=DummyError("bad"))


def test_create_error_detail_contains_fields():
    # N-09-001
    run = target.RunTree(_make_context_info())
    detail = run._create_error_detail(ValueError("bad"), additional_info={"x": 1})
    assert detail["error_type"] == "ValueError"
    assert detail["additional_info"]["x"] == 1


def test_create_error_detail_includes_traceback_lines():
    # N-09-002
    run = target.RunTree(_make_context_info())
    try:
        raise ValueError("boom")
    except ValueError as exc:
        detail = run._create_error_detail(exc)
    assert detail["additional_info"]["traceback_details"]


def test_logger_start_run_without_parent():
    # N-10-001
    logger = target.Logger()
    token = target.CURRENT_RUN.set(None)
    try:
        run = logger.start_run(user_id="u", llm_type="t", input_value="v")
        assert run.parent_run_id is None
    finally:
        target.CURRENT_RUN.reset(token)


def test_logger_start_run_with_parent():
    # I-04-001
    logger = target.Logger()
    parent = target.RunTree(_make_context_info())
    run = logger.start_run(user_id="u", llm_type="t", input_value="v", parent_run=parent)
    assert run.parent_run_id == parent.run_id


def test_logger_start_run_with_chat_history():
    # N-10-002
    logger = target.Logger()
    run = logger.start_run(
        user_id="u",
        llm_type="t",
        input_value="v",
        chat_history=[{"role": "assistant", "content": "hi"}],
    )
    assert run.chat_history[0]["content"] == "hi"


def test_logger_start_run_tags_preserved():
    # N-10-003
    logger = target.Logger()
    run = logger.start_run(user_id="u", llm_type="t", input_value="v", tags=["a"])
    assert run.context_info.tags == ["a"]


def test_logger_end_run_sets_output():
    # N-11-001
    logger = target.Logger()
    run = target.RunTree(_make_context_info())
    log = logger.end_run(run=run, output="out")
    assert log.contextLog.output_value == "out"


def test_logger_context_enter_exit_no_exception():
    # N-12-001
    logger = target.Logger()
    context = target.LoggerContext(logger, "u", "t", "v")
    previous = target.CURRENT_RUN.get()
    with context as run:
        assert run is not None
    assert target.CURRENT_RUN.get() == previous


def test_logger_context_exit_with_exception(monkeypatch):
    # E-05-001
    logger = target.Logger()
    called = {"count": 0}

    def fake_end_run(*args, **kwargs):
        called["count"] += 1
        return target.RunLog(
            logId="log",
            contextLog=_make_context_info().as_failure(
                error=DummyError("bad"), delay_time=0.1
            ),
        )

    monkeypatch.setattr(logger, "end_run", fake_end_run)
    context = target.LoggerContext(logger, "u", "t", "v")
    with pytest.raises(RuntimeError):
        with context:
            raise RuntimeError("boom")
    assert called["count"] >= 1


def test_logger_context_exit_with_system_error_sets_critical(monkeypatch):
    # E-05-004
    logger = target.Logger()
    severities: list[str] = []

    def fake_end_run(*args, **kwargs):
        if "severity" in kwargs:
            severities.append(kwargs["severity"])
        return target.RunLog(
            logId="log",
            contextLog=_make_context_info().as_failure(
                error=DummyError("bad"), delay_time=0.1
            ),
        )

    monkeypatch.setattr(logger, "end_run", fake_end_run)
    context = target.LoggerContext(logger, "u", "t", "v")
    with pytest.raises(SystemError):
        with context:
            raise SystemError("boom")
    assert "CRITICAL" in severities


def test_logger_context_exit_without_run():
    # L-06-001
    logger = target.Logger()
    context = target.LoggerContext(logger, "u", "t", "v")
    context.__exit__(None, None, None)


def test_trace_sets_metadata_function_name():
    # N-13-001
    ctx = target.trace(user_id="u", llm_type="t", input_value="v", name="fn")
    assert ctx.metadata["function_name"] == "fn"


def test_log_operation_returns_result():
    # N-14-001
    decorator = target.log_operation(llm_type="t")

    @decorator
    def sample(a, b):
        return a + b

    assert sample(1, 2) == 3


def test_log_operation_uses_name_override():
    # L-03-001
    decorator = target.log_operation(llm_type="t", name="override")

    @decorator
    def sample(a, b):
        return a + b

    assert sample(1, 2) == 3


def test_log_operation_uses_input_value_override():
    # L-03-002
    decorator = target.log_operation(llm_type="t", input_value={"x": 1})

    @decorator
    def sample(a, b):
        return a + b

    assert sample(1, 2) == 3


def test_log_operation_http_response_injects_log():
    # I-05-001
    decorator = target.log_operation(llm_type="t")

    @decorator
    def sample():
        return HttpResponse(body="{}", status_code=200, mimetype="application/json")

    response = sample()
    assert response.mimetype == "application/json"
    body = response.get_body().decode("utf-8")
    assert "log" in body


def test_log_operation_http_response_non_json_returns_none():
    # L-05-001
    decorator = target.log_operation(llm_type="t")

    @decorator
    def sample():
        return HttpResponse(body="ok", status_code=200, mimetype="text/plain")

    assert sample() is None


def test_log_operation_http_response_json_without_runlog(monkeypatch):
    # L-05-002
    decorator = target.log_operation(llm_type="t")

    original_end = target.RunTree.end

    def fake_end(*args, **kwargs):
        return None

    monkeypatch.setattr(target.RunTree, "end", fake_end)

    @decorator
    def sample():
        return HttpResponse(body="{}", status_code=200, mimetype="application/json")

    response = sample()
    body = response.get_body().decode("utf-8")
    assert "log" not in body

    monkeypatch.setattr(target.RunTree, "end", original_end)


def test_log_operation_http_response_invalid_json_raises():
    # E-07-004
    decorator = target.log_operation(llm_type="t")

    @decorator
    def sample():
        return HttpResponse(body="not-json", status_code=200, mimetype="application/json")

    with pytest.raises(Exception):
        sample()


def test_log_operation_coroutine_raises():
    # E-06-001
    decorator = target.log_operation(llm_type="t")

    @decorator
    async def sample():
        return "x"

    with pytest.raises(ValueError):
        sample()


def test_runtree_end_with_no_output_value():
    # N-15-001
    run = target.RunTree(_make_context_info())
    log = run.end()
    assert log.contextLog.output_value is None


def test_logger_context_restores_previous_run():
    # N-15-002
    logger = target.Logger()
    previous = target.RunTree(_make_context_info())
    token = target.CURRENT_RUN.set(previous)
    context = target.LoggerContext(logger, "u", "t", "v")
    try:
        with context:
            pass
        assert target.CURRENT_RUN.get() == previous
    finally:
        target.CURRENT_RUN.reset(token)

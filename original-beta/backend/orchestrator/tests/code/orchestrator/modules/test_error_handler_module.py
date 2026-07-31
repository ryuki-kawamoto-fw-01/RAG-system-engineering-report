import json
import sys
from pathlib import Path

import azure.functions as azure_func
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

import modules.error_handler as target  # noqa: E402


class _BaseOpenAIError(Exception):
    pass


class _RateLimitError(_BaseOpenAIError):
    pass


class _BadRequestError(_BaseOpenAIError):
    pass


class _AuthError(_BaseOpenAIError):
    pass


class _DummyLogTag:
    class TEXT:
        value = "TEXT"


class _DummyLLMSpecificError(Exception):
    def __init__(self, error_id: str, fmt_kwargs: dict):
        super().__init__("llm")
        self.error_id = error_id
        self.fmt_kwargs = fmt_kwargs


def _patch_error_handler_dependencies(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(target, "OpenAIError", _BaseOpenAIError)
    monkeypatch.setattr(target, "RateLimitError", _RateLimitError)
    monkeypatch.setattr(target, "BadRequestError", _BadRequestError)
    monkeypatch.setattr(target, "AuthenticationError", _AuthError)
    monkeypatch.setattr(target, "LLMSpecificError", _DummyLLMSpecificError)

    monkeypatch.setattr(target, "TAG_GROUPS", {"CHAT": ["CHAT"]})
    monkeypatch.setattr(target, "LogTag", _DummyLogTag)

    monkeypatch.setattr(
        target,
        "EXC_TO_TABLE",
        {
            _RateLimitError: ("E_B1_00030", target.ErrorCode.RATE_LIMIT),
            _AuthError: ("E_B1_00050", target.ErrorCode.UNAUTHORIZED),
            ValueError: ("E_B1_00060", target.ErrorCode.BAD_REQUEST),
            KeyError: ("E_B1_00070", target.ErrorCode.BAD_REQUEST),
            _DummyLLMSpecificError: ("", target.ErrorCode.INTERNAL_ERROR),
            Exception: ("E_B1_00080", target.ErrorCode.INTERNAL_ERROR),
        },
    )

    monkeypatch.setattr(
        target,
        "ERROR_MESSAGES",
        {
            "E_B1_00030": "rate",
            "E_B1_00050": "auth",
            "E_B1_00060": "val:{value}",
            "E_B1_00070": "key:{value}",
            "E_B1_00080": "unexpected",
            "E_B1_00020": "token overrun {value}",
            "E_B1_00090": "filtered: {filter_reasons}",
            "E_B1_00100": "filtered empty",
            "E_B1_00110": "bad request other",
            "E_B1_00120": "msg",
            "E_B1_00130": "other",
        },
    )


def test_safe_format_does_not_fail_on_missing_keys():
    # L-01-001
    s = target.ErrorHandler._safe_format("x={x} y={y}", x="1")
    assert s == "x=1 y="


def test_get_error_tags_openai_and_value_and_default(monkeypatch: pytest.MonkeyPatch):
    # I-01-002
    _patch_error_handler_dependencies(monkeypatch)

    assert target.ErrorHandler._get_error_tags(_RateLimitError) == ["CHAT"]
    assert target.ErrorHandler._get_error_tags(ValueError) == ["TEXT"]
    assert target.ErrorHandler._get_error_tags(Exception) == ["TEXT"]


def test_handle_error_maps_value_error_to_400(monkeypatch: pytest.MonkeyPatch):
    # E-01-001
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(ValueError("bad"))
    assert status == 400
    assert body["status_code"] == 400
    assert body["error_id"]


def test_handle_error_maps_rate_limit_to_429(monkeypatch: pytest.MonkeyPatch):
    # E-01-002
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(_RateLimitError("x"))
    assert status == 429
    assert body["error_id"] == "E_B1_00030"


def test_handle_error_maps_auth_error_to_401(monkeypatch: pytest.MonkeyPatch):
    # E-01-005
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(_AuthError("x"))
    assert status == 401
    assert body["error_id"] == "E_B1_00050"


def test_handle_error_llm_specific_error_uses_dynamic_error_id_and_kwargs(monkeypatch: pytest.MonkeyPatch):
    # E-01-003
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(_DummyLLMSpecificError("E_B1_00060", {"value": "V"}))
    assert status == 500
    assert body["error_id"] == "E_B1_00060"
    assert "val:V" in body["error_message"]


def test_handle_error_defaults_to_internal_error_for_runtime_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-006
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(RuntimeError("boom"))
    assert status == 500
    assert body["error_id"] == "E_B1_00080"


def test_handle_error_maps_key_error_to_400(monkeypatch: pytest.MonkeyPatch):
    # E-01-007
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(KeyError("missing"))
    assert status == 400
    assert body["error_id"] == "E_B1_00070"


def test_handle_error_uses_default_message_when_unknown_error_id(monkeypatch: pytest.MonkeyPatch):
    # E-01-008
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(_DummyLLMSpecificError("UNKNOWN", {}))
    assert status == 500
    assert body["error_message"] == "予期しない問題が発生しました。"


def test_get_error_tags_for_openai_error_base(monkeypatch: pytest.MonkeyPatch):
    # N-01-004
    _patch_error_handler_dependencies(monkeypatch)
    assert target.ErrorHandler._get_error_tags(_BaseOpenAIError) == ["CHAT"]


@pytest.mark.parametrize(
    "raw_msg,expected_id,expected_status,expected_msg_part",
    [
        # E-02-001
        pytest.param(
            "maximum context length exceeded",
            "E_B1_00020",
            400,
            "token overrun",
            id="E-02-001",
        ),
        # E-02-002
        pytest.param(
            "BadRequestError - {'error': {'innererror': {'content_filter_result': {'hate': {'filtered': True}, 'sexual': {'filtered': False}}}}}",
            "E_B1_00090",
            400,
            "filtered:",
            id="E-02-002",
        ),
        # E-02-003
        pytest.param(
            "BadRequestError - {'error': {'innererror': {'content_filter_result': {'hate': {'filtered': False}}}}}",
            "E_B1_00100",
            400,
            "filtered empty",
            id="E-02-003",
        ),
        # E-02-004
        pytest.param(
            "BadRequestError - {'error': {'message': 'x'}}",
            "E_B1_00110",
            400,
            "bad request other",
            id="E-02-004",
        ),
        # E-02-005
        pytest.param(
            "BadRequestError - ['x']",
            "E_B1_00110",
            400,
            "bad request other",
            id="E-02-005",
        ),
    ],
)
def test_handle_error_bad_request_variants(monkeypatch: pytest.MonkeyPatch, raw_msg, expected_id, expected_status, expected_msg_part):
    _patch_error_handler_dependencies(monkeypatch)
    body, status = target.ErrorHandler.handle_error(_BadRequestError(raw_msg))
    assert status == expected_status
    assert body["error_id"] == expected_id
    assert expected_msg_part in body["error_message"]


def test_try_extract_json_handles_prefix_and_type_error(monkeypatch: pytest.MonkeyPatch):
    # L-01-002
    _patch_error_handler_dependencies(monkeypatch)
    d = target.ErrorHandler._try_extract_json("BadRequestError - {'a': 1}")
    assert d == {"a": 1}
    with pytest.raises(TypeError):
        target.ErrorHandler._try_extract_json(None)  # type: ignore[arg-type]


def test_try_extract_json_raises_on_unparseable_string(monkeypatch: pytest.MonkeyPatch):
    # E-01-004
    _patch_error_handler_dependencies(monkeypatch)
    with pytest.raises(Exception):
        target.ErrorHandler._try_extract_json("{not: python}")


@pytest.mark.parametrize(
    "extension,expected_id",
    [
        # N-01-001
        pytest.param("msg", "E_B1_00120", id="N-01-001"),
        # N-01-002
        pytest.param("pdf", "E_B1_00130", id="N-01-002"),
    ],
)
def test_file_table(extension, expected_id):
    error_id, http_status, _ = target.ErrorHandler._file_table(extension)
    assert error_id == expected_id
    assert http_status.value == 400


def test_file_table_treats_empty_extension_as_other():
    # L-01-003
    error_id, http_status, _ = target.ErrorHandler._file_table("")
    assert error_id == "E_B1_00130"
    assert http_status.value == 400


def test_file_table_treats_dot_msg_as_other():
    # L-01-004
    error_id, http_status, _ = target.ErrorHandler._file_table(".msg")
    assert error_id == "E_B1_00130"
    assert http_status.value == 400


def test_azure_function_error_handler_wraps_exception_into_http_response():
    # I-01-001
    def boom(req):
        raise ValueError("bad")

    wrapped = target.azure_function_error_handler(boom)
    resp = wrapped(None)  # type: ignore[arg-type]
    assert isinstance(resp, azure_func.HttpResponse)
    assert resp.status_code == 400
    data = json.loads(resp.get_body())
    assert data["status_code"] == 400
    assert data["error_id"]
    assert wrapped.__name__ == "boom"


def test_azure_function_error_handler_returns_success_response(monkeypatch: pytest.MonkeyPatch):
    # N-01-003
    _patch_error_handler_dependencies(monkeypatch)

    def ok(req):
        return azure_func.HttpResponse("ok", status_code=200)

    wrapped = target.azure_function_error_handler(ok)
    resp = wrapped(None)  # type: ignore[arg-type]
    assert isinstance(resp, azure_func.HttpResponse)
    assert resp.status_code == 200

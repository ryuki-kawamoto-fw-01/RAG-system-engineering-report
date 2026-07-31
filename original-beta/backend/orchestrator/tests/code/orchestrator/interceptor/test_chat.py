import json
import os
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

# Import-time dependencies require these.
os.environ.setdefault("MODEL_IDENTIFIER", "test")
os.environ.setdefault("LOAD_BALANCER_ENDPOINT", "https://example")
os.environ.setdefault("AZURE_OPENAI_VERSION", "2024-10-21")

import interceptor.chat as target  # noqa: E402


class DummyRequest:
    def __init__(self, json_body=None, json_raises: bool = False):
        self._json_body = json_body
        self._json_raises = json_raises

    def get_json(self):
        if self._json_raises:
            raise ValueError("invalid json")
        return self._json_body


class DummyBlobClient:
    def __init__(self, data: bytes = b"dummy"):
        self._data = data

    def download_blob(self):
        return self

    def readall(self):
        return self._data


class DummyContainerClient:
    def __init__(self, blob_client: DummyBlobClient):
        self._blob_client = blob_client
        self.last_blob_name = None

    def get_blob_client(self, *, blob: str):
        self.last_blob_name = blob
        return self._blob_client


def test_resolve_error_table_returns_file_table_for_encrypted(monkeypatch: pytest.MonkeyPatch):
    # E-01-001
    blob = DummyBlobClient(b"not-really-a-pdf")
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    monkeypatch.setattr(target.CommonValidation, "is_encrypted", lambda file, extension: True)

    monkeypatch.setattr(
        target.ChatInterceptor,
        "_file_table",
        classmethod(lambda cls, extension: ("E_TEST_ENCRYPTED", target.ErrorCode.BAD_REQUEST, {"ext": extension})),
    )

    req = DummyRequest(json_body={"fileName": "temp/a.pdf"})
    error_id, http_status, fmt_kwargs = target.ChatInterceptor._resolve_error_table(Exception("x"), req)

    assert container.last_blob_name == "temp/a.pdf"
    assert error_id == "E_TEST_ENCRYPTED"
    assert http_status == target.ErrorCode.BAD_REQUEST
    assert fmt_kwargs["ext"] == "pdf"


def test_resolve_error_table_delegates_to_super_when_not_encrypted(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    blob = DummyBlobClient(b"plain")
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    monkeypatch.setattr(target.CommonValidation, "is_encrypted", lambda file, extension: False)

    monkeypatch.setattr(
        target.ErrorHandler,
        "_resolve_error_table",
        classmethod(lambda cls, err: ("E_SUPER", target.ErrorCode.INTERNAL_ERROR, {"value": "x"})),
    )

    req = DummyRequest(json_body={"fileName": "temp/a.txt"})
    error_id, http_status, fmt_kwargs = target.ChatInterceptor._resolve_error_table(Exception("x"), req)

    assert container.last_blob_name == "temp/a.txt"
    assert error_id == "E_SUPER"
    assert http_status == target.ErrorCode.INTERNAL_ERROR
    assert fmt_kwargs["value"] == "x"


def test_resolve_error_table_skips_storage_when_file_name_missing(monkeypatch: pytest.MonkeyPatch):
    # N-01-001
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: (_ for _ in ()).throw(AssertionError("should not be called")))

    monkeypatch.setattr(
        target.ErrorHandler,
        "_resolve_error_table",
        classmethod(lambda cls, err: ("E_SUPER", target.ErrorCode.INTERNAL_ERROR, {"value": "x"})),
    )

    req = DummyRequest(json_body={})
    error_id, http_status, _ = target.ChatInterceptor._resolve_error_table(Exception("x"), req)

    assert error_id == "E_SUPER"
    assert http_status == target.ErrorCode.INTERNAL_ERROR


def test_handle_error_returns_expected_shape_when_req_has_no_file(monkeypatch: pytest.MonkeyPatch):
    # N-02-001
    req = DummyRequest(json_body={})
    body, status_code = target.ChatInterceptor.handle_error(Exception("boom"), req)

    assert status_code == 500
    assert body["status_code"] == 500
    assert body["error_id"]
    assert body["error_message"]
    assert body["log_details"]["error_type"] == "Exception"
    assert "timestamp" in body["log_details"]


def test_chat_error_handler_returns_http_response_on_exception(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    monkeypatch.setattr(target.ChatInterceptor, "handle_error", classmethod(lambda cls, err, req: ({"ok": False}, 418)))

    def boom(req):
        raise RuntimeError("nope")

    wrapped = target.chat_error_handler(boom)

    resp = wrapped(DummyRequest(json_body={}))
    assert resp.status_code == 418
    assert wrapped.__name__ == "boom"
    assert json.loads(resp.get_body()) == {"ok": False}


def test_handle_error_maps_value_error_to_400(monkeypatch: pytest.MonkeyPatch):
    # E-02-001
    req = DummyRequest(json_body={})
    body, status_code = target.ChatInterceptor.handle_error(ValueError("bad"), req)

    assert status_code == 400
    assert body["status_code"] == 400


def test_handle_error_uses_file_table_when_encrypted_file(monkeypatch: pytest.MonkeyPatch):
    # I-01-002
    blob = DummyBlobClient(b"encrypted?")
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    monkeypatch.setattr(target.CommonValidation, "is_encrypted", lambda file, extension: True)
    monkeypatch.setattr(
        target.ChatInterceptor,
        "_file_table",
        classmethod(lambda cls, extension: ("E_FILE", target.ErrorCode.BAD_REQUEST, {"ext": extension})),
    )

    req = DummyRequest(json_body={"fileName": "temp/a.msg"})
    body, status_code = target.ChatInterceptor.handle_error(Exception("boom"), req)

    assert status_code == 400
    assert body["error_id"] == "E_FILE"


def test_chat_error_handler_passes_through_on_success():
    # N-03-001
    def ok(req):
        return azure_func.HttpResponse("ok", status_code=200)

    wrapped = target.chat_error_handler(ok)
    resp = wrapped(DummyRequest(json_body={}))
    assert resp.status_code == 200
    assert resp.get_body() == b"ok"
    assert wrapped.__name__ == "ok"


def test_resolve_error_table_uses_last_extension_segment(monkeypatch: pytest.MonkeyPatch):
    # L-02-001
    blob = DummyBlobClient(b"data")
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)
    monkeypatch.setattr(target.CommonValidation, "is_encrypted", lambda file, extension: True)

    seen = {"ext": None}

    def fake_file_table(cls, extension: str):
        seen["ext"] = extension
        return ("E_X", target.ErrorCode.BAD_REQUEST, {})

    monkeypatch.setattr(target.ChatInterceptor, "_file_table", classmethod(fake_file_table))

    req = DummyRequest(json_body={"fileName": "temp/a.b.c.txt"})
    target.ChatInterceptor._resolve_error_table(Exception("x"), req)
    assert seen["ext"] == "txt"


def test_resolve_error_table_calls_is_encrypted_twice(monkeypatch: pytest.MonkeyPatch):
    # L-02-002
    blob = DummyBlobClient(b"data")
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    calls = {"n": 0}

    def fake_is_encrypted(file, extension: str) -> bool:
        calls["n"] += 1
        return False

    monkeypatch.setattr(target.CommonValidation, "is_encrypted", fake_is_encrypted)
    monkeypatch.setattr(
        target.ErrorHandler,
        "_resolve_error_table",
        classmethod(lambda cls, err: ("E_SUPER", target.ErrorCode.INTERNAL_ERROR, {"value": "x"})),
    )

    req = DummyRequest(json_body={"fileName": "temp/a.txt"})
    target.ChatInterceptor._resolve_error_table(Exception("x"), req)
    assert calls["n"] == 2

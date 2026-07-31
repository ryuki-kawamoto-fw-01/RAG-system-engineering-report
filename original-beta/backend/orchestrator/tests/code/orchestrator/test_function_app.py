import json
import os
import sys
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

import pytest
from openai.types.chat import ChatCompletion, ChatCompletionMessage
from openai.types.chat.chat_completion import Choice, CompletionUsage


def _add_orchestrator_to_syspath() -> None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "backend" / "orchestrator"
        if (candidate / "function_app.py").exists():
            sys.path.insert(0, str(candidate))
            return
    raise RuntimeError("Could not locate backend/orchestrator to add to sys.path")


_add_orchestrator_to_syspath()

# Import-time dependencies (modules/title.py, modules/recommend.py, etc.) require these.
os.environ.setdefault("MODEL_IDENTIFIER", "test")
os.environ.setdefault("LOAD_BALANCER_ENDPOINT", "https://example")
os.environ.setdefault("AZURE_OPENAI_VERSION", "2024-10-21")

import function_app as target  # noqa: E402


class DummyRequest:
    def __init__(self, *, files=None, form=None, json_body=None, json_raises=False):
        self.files = files
        self.form = form
        self._json_body = json_body
        self._json_raises = json_raises

    def get_json(self):
        if self._json_raises:
            raise ValueError("invalid json")
        return self._json_body


class DummyBlobClient:
    def __init__(self, *, exists: bool):
        self._exists = exists
        self.upload_calls = []
        self.deleted = False

    def exists(self):
        return self._exists

    def upload_blob(self, file, overwrite: bool, content_settings=None):
        self.upload_calls.append({"file": file, "overwrite": overwrite, "content_settings": content_settings})

    def delete_blob(self):
        self.deleted = True

    def download_blob(self):
        return self

    def readall(self):
        return b"dummy"


class DummyContainerClient:
    def __init__(self, blob_client: DummyBlobClient):
        self._blob_client = blob_client
        self.last_blob_name = None

    def get_blob_client(self, *, blob: str):
        self.last_blob_name = blob
        return self._blob_client


def _body(resp) -> dict:
    return json.loads(resp.get_body())


@contextmanager
def _dummy_trace(*args, **kwargs):
    class _Run:
        def output(self, *args, **kwargs):
            return None

    yield _Run()


def _make_chat_completion(content: str = "ok") -> ChatCompletion:
    return ChatCompletion(
        id="test-id",
        model="test-model",
        object="chat.completion",
        created=int(datetime.now().timestamp()),
        choices=[
            Choice(
                finish_reason="stop",
                index=0,
                message=ChatCompletionMessage(content=content, role="assistant"),
            )
        ],
        usage=CompletionUsage(completion_tokens=10, prompt_tokens=20, total_tokens=30),
    )


class DummyAzureOpenAI:
    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.calls = []

        class _Completions:
            def __init__(self, outer):
                self.outer = outer

            def create(self, **params):
                self.outer.calls.append(params)
                return _make_chat_completion("answer")

        class _Chat:
            def __init__(self, outer):
                self.completions = _Completions(outer)

        self.chat = _Chat(self)


def _identity_log_operation(*args, **kwargs):
    def deco(fn):
        return fn

    return deco


@pytest.mark.parametrize(
    "files, form",
    [
        (None, None),
        ({"file": b"x"}, None),
        (None, {"filename": "temp/a.txt", "type": "text/plain"}),
        ({}, {"filename": "temp/a.txt", "type": "text/plain"}),
        ({"file": b"x"}, {"type": "text/plain"}),
        ({"file": b"x"}, {"filename": "temp/a.txt"}),
    ],
)
def test_upload_file_returns_400_on_invalid_input(files, form):
    # E-01-001
    req = DummyRequest(files=files, form=form)
    resp = target.upload_file(req)
    assert resp.status_code == 400


@pytest.mark.parametrize(
    "filename",
    [
        "nope/a.txt",
        "../temp/a.txt",
        "Temp/a.txt",
    ],
)
def test_upload_file_rejects_disallowed_path(filename):
    # E-01-002
    req = DummyRequest(files={"file": b"x"}, form={"filename": filename, "type": "text/plain"})
    resp = target.upload_file(req)
    assert resp.status_code == 403


def test_upload_file_uploads_with_overwrite_when_blob_exists(monkeypatch: pytest.MonkeyPatch):
    # N-01-001
    blob = DummyBlobClient(exists=True)
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)
    monkeypatch.setattr(target, "generate_sas_url", lambda filename: f"sas://{filename}")

    req = DummyRequest(files={"file": b"x"}, form={"filename": "temp/a.txt", "type": "text/plain"})
    resp = target.upload_file(req)

    assert resp.status_code == 200
    data = _body(resp)
    assert data["success"] is True
    assert data["filename"] == "temp/a.txt"
    assert data["url"] == "sas://temp/a.txt"
    assert container.last_blob_name == "temp/a.txt"
    assert blob.upload_calls and blob.upload_calls[0]["overwrite"] is True


def test_upload_file_uploads_without_overwrite_when_blob_missing(monkeypatch: pytest.MonkeyPatch):
    # N-01-002
    blob = DummyBlobClient(exists=False)
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)
    monkeypatch.setattr(target, "generate_sas_url", lambda filename: f"sas://{filename}")

    req = DummyRequest(files={"file": b"x"}, form={"filename": "temp/a.txt", "type": "text/plain"})
    resp = target.upload_file(req)

    assert resp.status_code == 200
    assert blob.upload_calls and blob.upload_calls[0]["overwrite"] is False


@pytest.mark.parametrize(
    "filename",
    [
        "temp",
        "temp/",
    ],
)
def test_upload_file_allows_temp_root_edge_filenames(monkeypatch: pytest.MonkeyPatch, filename: str):
    # L-01-001
    blob = DummyBlobClient(exists=False)
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)
    monkeypatch.setattr(target, "generate_sas_url", lambda fn: f"sas://{fn}")

    req = DummyRequest(files={"file": b"x"}, form={"filename": filename, "type": "text/plain"})
    resp = target.upload_file(req)

    assert resp.status_code == 200
    assert container.last_blob_name == filename


def test_delete_file_returns_400_on_invalid_json():
    # E-02-001
    req = DummyRequest(json_raises=True)
    resp = target.delete_file(req)
    assert resp.status_code == 400


def test_delete_file_returns_400_when_filename_missing():
    # E-02-002
    req = DummyRequest(json_body={})
    resp = target.delete_file(req)
    assert resp.status_code == 400


def test_delete_file_rejects_disallowed_path():
    # E-02-003
    req = DummyRequest(json_body={"filename": "nope/a.txt"})
    resp = target.delete_file(req)
    assert resp.status_code == 403


def test_delete_file_returns_404_when_blob_missing(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    blob = DummyBlobClient(exists=False)
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    req = DummyRequest(json_body={"filename": "temp/a.txt"})
    resp = target.delete_file(req)
    assert resp.status_code == 404


def test_delete_file_deletes_blob_when_exists(monkeypatch: pytest.MonkeyPatch):
    # N-02-001
    blob = DummyBlobClient(exists=True)
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    req = DummyRequest(json_body={"filename": "temp/a.txt"})
    resp = target.delete_file(req)
    assert resp.status_code == 200
    data = _body(resp)
    assert data["success"] is True
    assert data["filename"] == "temp/a.txt"
    assert blob.deleted is True


@pytest.mark.parametrize(
    "filename",
    [
        "nope/a.txt",
        "../temp/a.txt",
        "Temp/a.txt",
    ],
)
def test_delete_file_rejects_disallowed_path_variations(filename: str):
    # E-02-004
    req = DummyRequest(json_body={"filename": filename})
    resp = target.delete_file(req)
    assert resp.status_code == 403


def test_chat_rejects_missing_question(monkeypatch: pytest.MonkeyPatch):
    # E-03-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    monkeypatch.setattr(target, "AzureOpenAI", DummyAzureOpenAI)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: [])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 0, 0, 0.0))

    req = DummyRequest(json_body={"model": "gpt-5.2", "question": ""})
    resp = target.chat(req)
    assert resp.status_code == 400


def test_chat_rejects_missing_model(monkeypatch: pytest.MonkeyPatch):
    # E-03-003
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    monkeypatch.setattr(target, "AzureOpenAI", DummyAzureOpenAI)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: [])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 0, 0, 0.0))

    req = DummyRequest(json_body={"question": "hi"})
    resp = target.chat(req)
    assert resp.status_code == 400


def test_chat_rejects_invalid_model(monkeypatch: pytest.MonkeyPatch):
    # E-03-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    monkeypatch.setattr(target, "AzureOpenAI", DummyAzureOpenAI)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: [])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 0, 0, 0.0))

    req = DummyRequest(json_body={"model": "nope", "question": "hi"})
    resp = target.chat(req)
    assert resp.status_code == 400


def test_chat_sets_reasoning_effort_none_for_gpt_5_2(monkeypatch: pytest.MonkeyPatch):
    # N-03-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    dummy_client = DummyAzureOpenAI()
    monkeypatch.setattr(target, "AzureOpenAI", lambda **kwargs: dummy_client)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: ["r"])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 1, 2, 0.1))

    req = DummyRequest(json_body={"model": "gpt-5.2", "question": "hi", "chatHistory": []})
    resp = target.chat(req)

    assert resp.status_code == 200
    body = _body(resp)
    assert body["answer"] == "answer"
    assert dummy_client.calls, "expected AzureOpenAI.chat.completions.create to be called"
    assert dummy_client.calls[0]["model"] == "gpt-5.2-id"
    assert dummy_client.calls[0]["reasoning_effort"] == "none"


def test_chat_maps_gpt_5_2_reasoning_to_medium(monkeypatch: pytest.MonkeyPatch):
    # N-03-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    dummy_client = DummyAzureOpenAI()
    monkeypatch.setattr(target, "AzureOpenAI", lambda **kwargs: dummy_client)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: ["r"])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 1, 2, 0.1))

    req = DummyRequest(json_body={"model": "gpt-5.2-reasoning", "question": "hi", "chatHistory": []})
    resp = target.chat(req)

    assert resp.status_code == 200
    body = _body(resp)
    assert body["answer"] == "answer"
    assert dummy_client.calls, "expected AzureOpenAI.chat.completions.create to be called"
    assert dummy_client.calls[0]["model"] == "gpt-5.2-id"
    assert dummy_client.calls[0]["reasoning_effort"] == "medium"


def test_chat_does_not_include_reasoning_effort_for_gpt_4_1(monkeypatch: pytest.MonkeyPatch):
    # L-01-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    dummy_client = DummyAzureOpenAI()
    monkeypatch.setattr(target, "AzureOpenAI", lambda **kwargs: dummy_client)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: ["r"])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 1, 2, 0.1))

    req = DummyRequest(json_body={"model": "gpt-4.1", "question": "hi", "chatHistory": []})
    resp = target.chat(req)

    assert resp.status_code == 200
    body = _body(resp)
    assert body["answer"] == "answer"
    assert dummy_client.calls[0]["model"] == "gpt-4.1-id"
    assert "reasoning_effort" not in dummy_client.calls[0]


def test_chat_builds_image_message_when_image_attached(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    blob = DummyBlobClient(exists=True)
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    dummy_client = DummyAzureOpenAI()
    monkeypatch.setattr(target, "AzureOpenAI", lambda **kwargs: dummy_client)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: ["r"])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 1, 2, 0.1))

    req = DummyRequest(
        json_body={
            "model": "gpt-5.2",
            "question": "hi",
            "chatHistory": [],
            "fileName": "temp/img.png",
            "mediaType": "image/png",
        }
    )
    resp = target.chat(req)

    assert resp.status_code == 200
    assert dummy_client.calls
    messages = dummy_client.calls[0]["messages"]
    assert messages[-1]["role"] == "user"
    content = messages[-1]["content"]
    assert isinstance(content, list)
    assert content[0]["type"] == "text"
    assert content[1]["type"] == "image_url"


def test_chat_builds_text_attachment_prompt_and_calls_get_file_content(monkeypatch: pytest.MonkeyPatch):
    # I-01-002
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    blob = DummyBlobClient(exists=True)
    container = DummyContainerClient(blob)
    monkeypatch.setattr(target, "create_tempfile_container_client", lambda: container)

    called = {"count": 0}

    def fake_get_file_content(file_content, file_extension):
        called["count"] += 1
        assert isinstance(file_content, str)
        assert file_extension == "txt"
        return "TEXT"

    monkeypatch.setattr(target, "get_file_content", fake_get_file_content)

    dummy_client = DummyAzureOpenAI()
    monkeypatch.setattr(target, "AzureOpenAI", lambda **kwargs: dummy_client)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: ["r"])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 1, 2, 0.1))

    req = DummyRequest(
        json_body={
            "model": "gpt-5.2",
            "question": "hi",
            "chatHistory": [],
            "fileName": "temp/a.txt",
            "mediaType": "text/plain",
        }
    )
    resp = target.chat(req)
    assert resp.status_code == 200
    assert called["count"] == 1

    messages = dummy_client.calls[0]["messages"]
    assert messages[-1]["role"] == "user"
    assert "# 添付ファイルの内容" in messages[-1]["content"]


def test_chat_truncates_chat_history_to_last_6(monkeypatch: pytest.MonkeyPatch):
    # L-01-003
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    dummy_client = DummyAzureOpenAI()
    monkeypatch.setattr(target, "AzureOpenAI", lambda **kwargs: dummy_client)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: ["r"])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 1, 2, 0.1))

    chat_history = [{"role": "user", "content": f"m{i}"} for i in range(10)]
    req = DummyRequest(json_body={"model": "gpt-5.2", "question": "hi", "chatHistory": chat_history})
    resp = target.chat(req)
    assert resp.status_code == 200

    messages = dummy_client.calls[0]["messages"]
    # system + last 6 history + user
    assert len(messages) == 1 + 6 + 1
    assert messages[1]["content"] == "m4"
    assert messages[6]["content"] == "m9"


def test_chat_response_shape_changes_when_chat_history_long(monkeypatch: pytest.MonkeyPatch):
    # L-01-004
    monkeypatch.setenv("MODEL_IDENTIFIER", "id")
    monkeypatch.setenv("LOAD_BALANCER_ENDPOINT", "https://example")
    monkeypatch.setenv("AZURE_OPENAI_VERSION", "2024-10-21")

    dummy_client = DummyAzureOpenAI()
    monkeypatch.setattr(target, "AzureOpenAI", lambda **kwargs: dummy_client)
    monkeypatch.setattr(target, "trace", _dummy_trace)
    monkeypatch.setattr(target, "log_operation", _identity_log_operation)
    monkeypatch.setattr(target, "generate_recommend", lambda history: ["r"])
    monkeypatch.setattr(target, "generate_thread_title", lambda history: ("t", 1, 2, 0.1))

    req = DummyRequest(
        json_body={
            "model": "gpt-5.2",
            "question": "hi",
            "chatHistory": [
                {"role": "user", "content": "a"},
                {"role": "assistant", "content": "b"},
                {"role": "user", "content": "c"},
            ],
        }
    )
    resp = target.chat(req)
    assert resp.status_code == 200
    data = _body(resp)
    assert "threadTitle" not in data

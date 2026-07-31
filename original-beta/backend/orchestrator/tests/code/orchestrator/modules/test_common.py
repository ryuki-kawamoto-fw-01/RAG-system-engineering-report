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

import modules.common as target  # noqa: E402


class DummyBlobClient:
    def __init__(self, *, exists: bool, url: str = "https://b", container_name: str = "c", blob_name: str = "n"):
        self._exists = exists
        self.url = url
        self.container_name = container_name
        self.blob_name = blob_name

    def exists(self):
        return self._exists


class DummyBlobServiceClient:
    def __init__(self, *, account_url: str, credential=None):
        self.account_url = account_url
        self.credential = credential
        self.account_name = "acct"
        self._blob_client = DummyBlobClient(exists=True)
        self.last = {}

    def get_container_client(self, container: str):
        self.last["container"] = container
        return f"container:{container}"

    def get_blob_client(self, *, container: str, blob: str):
        self.last["container"] = container
        self.last["blob"] = blob
        return self._blob_client

    def get_user_delegation_key(self, *args, **kwargs):
        return "UDK"


def test_create_tempfile_container_client_uses_env_and_returns_container(monkeypatch: pytest.MonkeyPatch):
    # N-01-001
    monkeypatch.setenv(target.TEMPFILE_CONNECTION_STRING_ENV, "https://storage")
    monkeypatch.setenv(target.TEMPFILE_CONTAINER_NAME, "temp")
    monkeypatch.setattr(target, "BlobServiceClient", DummyBlobServiceClient)

    cc = target.create_tempfile_container_client()
    assert cc == "container:temp"


def test_create_tempfile_container_client_raises_when_env_missing(monkeypatch: pytest.MonkeyPatch):
    # E-01-003
    monkeypatch.delenv(target.TEMPFILE_CONNECTION_STRING_ENV, raising=False)
    monkeypatch.delenv(target.TEMPFILE_CONTAINER_NAME, raising=False)
    with pytest.raises(KeyError):
        target.create_tempfile_container_client()


def test_generate_sas_url_raises_when_blob_missing(monkeypatch: pytest.MonkeyPatch):
    # E-01-001
    monkeypatch.setenv(target.TEMPFILE_CONNECTION_STRING_ENV, "https://storage")
    monkeypatch.setenv(target.TEMPFILE_CONTAINER_NAME, "temp")

    svc = DummyBlobServiceClient(account_url="https://storage")
    svc._blob_client = DummyBlobClient(exists=False)
    monkeypatch.setattr(target, "BlobServiceClient", lambda account_url, credential=None: svc)

    with pytest.raises(ValueError, match="ファイルが存在しません"):
        target.generate_sas_url("temp/a.txt")


def test_generate_sas_url_raises_when_account_name_missing(monkeypatch: pytest.MonkeyPatch):
    # E-01-002
    monkeypatch.setenv(target.TEMPFILE_CONNECTION_STRING_ENV, "https://storage")
    monkeypatch.setenv(target.TEMPFILE_CONTAINER_NAME, "temp")

    svc = DummyBlobServiceClient(account_url="https://storage")
    svc.account_name = ""
    monkeypatch.setattr(target, "BlobServiceClient", lambda account_url, credential=None: svc)

    with pytest.raises(ValueError, match="ストレージアカウント"):
        target.generate_sas_url("temp/a.txt")


def test_generate_sas_url_returns_signed_url(monkeypatch: pytest.MonkeyPatch):
    # N-01-002
    monkeypatch.setenv(target.TEMPFILE_CONNECTION_STRING_ENV, "https://storage")
    monkeypatch.setenv(target.TEMPFILE_CONTAINER_NAME, "temp")

    svc = DummyBlobServiceClient(account_url="https://storage")
    svc._blob_client = DummyBlobClient(exists=True, url="https://b/blob")
    monkeypatch.setattr(target, "BlobServiceClient", lambda account_url, credential=None: svc)
    monkeypatch.setattr(target, "generate_blob_sas", lambda **kwargs: "SAS")

    url = target.generate_sas_url("temp/a.txt", expiry_seconds=1)
    assert url == "https://b/blob?SAS"


def test_generate_sas_url_expiry_seconds_zero_is_accepted(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    monkeypatch.setenv(target.TEMPFILE_CONNECTION_STRING_ENV, "https://storage")
    monkeypatch.setenv(target.TEMPFILE_CONTAINER_NAME, "temp")

    svc = DummyBlobServiceClient(account_url="https://storage")
    svc._blob_client = DummyBlobClient(exists=True, url="https://b/blob")
    monkeypatch.setattr(target, "BlobServiceClient", lambda account_url, credential=None: svc)
    monkeypatch.setattr(target, "generate_blob_sas", lambda **kwargs: "SAS")

    url = target.generate_sas_url("temp/a.txt", expiry_seconds=0)
    assert url.endswith("?SAS")


def test_generate_sas_url_accepts_empty_blob_name(monkeypatch: pytest.MonkeyPatch):
    # L-01-002
    monkeypatch.setenv(target.TEMPFILE_CONNECTION_STRING_ENV, "https://storage")
    monkeypatch.setenv(target.TEMPFILE_CONTAINER_NAME, "temp")

    svc = DummyBlobServiceClient(account_url="https://storage")
    svc._blob_client = DummyBlobClient(exists=True, url="https://b/empty", blob_name="")
    monkeypatch.setattr(target, "BlobServiceClient", lambda account_url, credential=None: svc)
    monkeypatch.setattr(target, "generate_blob_sas", lambda **kwargs: "SAS")

    url = target.generate_sas_url("")
    assert url == "https://b/empty?SAS"
    assert svc.last["blob"] == ""


def test_generate_sas_url_calls_get_blob_client_with_container_and_blob(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    monkeypatch.setenv(target.TEMPFILE_CONNECTION_STRING_ENV, "https://storage")
    monkeypatch.setenv(target.TEMPFILE_CONTAINER_NAME, "temp")

    svc = DummyBlobServiceClient(account_url="https://storage")
    svc._blob_client = DummyBlobClient(exists=True, url="https://b/blob", container_name="temp", blob_name="a.txt")
    monkeypatch.setattr(target, "BlobServiceClient", lambda account_url, credential=None: svc)
    monkeypatch.setattr(target, "generate_blob_sas", lambda **kwargs: "SAS")

    _ = target.generate_sas_url("a.txt")
    assert svc.last["container"] == "temp"
    assert svc.last["blob"] == "a.txt"

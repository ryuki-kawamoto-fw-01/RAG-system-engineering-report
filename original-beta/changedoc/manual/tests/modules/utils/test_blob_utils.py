import os
from pathlib import Path
from typing import Any

import pytest

from modules.utils import blob_utils


# ----------------------------------
# Test のための準備
# ----------------------------------

class FakeDownloadStream:
	def __init__(self, data: bytes):
		self._data = data

	def readall(self) -> bytes:  # noqa: D401
		return self._data


class FakeBlobClient:
	def __init__(self, container: str, blob: str, stored: dict[str, Any]):
		self.container = container
		self.blob = blob
		self._store = stored
		self.url = f"https://example.blob.core.windows.net/{container}/{blob}"

	def download_blob(self):  # noqa: D401
		data = self._store.get("download_data", b"")
		return FakeDownloadStream(data)

	def upload_blob(self, data, overwrite: bool = False):  # noqa: D401
		if hasattr(data, "read"):
			content = data.read()
		else:
			content = data
		self._store.setdefault("uploads", []).append(
			{
				"container": self.container,
				"blob": self.blob,
				"data": content,
				"overwrite": overwrite,
			}
		)


class FakeBlobServiceClient:
	def __init__(self, store: dict[str, Any]):
		self._store = store

	def get_blob_client(self, container: str, blob: str):  # noqa: D401
		self._store["last_requested"] = {"container": container, "blob": blob}
		return FakeBlobClient(container, blob, self._store)

	@classmethod
	def from_connection_string(cls, conn: str):  # noqa: D401
		global _FAKE_BLOB_SERVICE_STORE  # type: ignore
		_FAKE_BLOB_SERVICE_STORE["connection_string"] = conn
		return cls(_FAKE_BLOB_SERVICE_STORE)


@pytest.fixture
def fake_blob_service(monkeypatch):
	"""Patch BlobServiceClient in target module with a controllable fake."""
	store: dict[str, Any] = {}
	monkeypatch.setenv("AZURE_STORAGE_CONNECTION_STRING", "UseDevelopmentStorage=true")
	monkeypatch.setitem(globals(), "_FAKE_BLOB_SERVICE_STORE", store)
	monkeypatch.setattr(blob_utils, "BlobServiceClient", FakeBlobServiceClient)
	return store

# ----------------------------------
# Tests: _get_connection_string
# ----------------------------------

class TestGetConnectionString:
	def test_success(self, monkeypatch):
		monkeypatch.setenv("AZURE_STORAGE_CONNECTION_STRING", "ConnString")
		assert blob_utils._get_connection_string() == "ConnString"

	def test_missing(self):
		with pytest.raises(ValueError):
			blob_utils._get_connection_string()

# ----------------------------------
# Tests: download_file_from_blob
# ----------------------------------

class TestDownloadFileFromBlob:
	def test_success(self, tmp_path: Path, fake_blob_service):
		fake_blob_service["download_data"] = b"hello-world"
		container = "my-container"
		blob_name = "folder/file.txt"
		local_path = blob_utils.download_file_from_blob(container, blob_name, str(tmp_path))
		p = Path(local_path)
		
		assert p.exists()
		assert p.read_bytes() == b"hello-world"
		assert str(p) == str(tmp_path / "folder" / "file.txt")
		assert p.name == "file.txt"
		assert fake_blob_service["last_requested"]["blob"] == blob_name

# ----------------------------------
# Tests: upload_content_to_blob
# ----------------------------------

class TestUploadContentToBlob:
	def test_with_str(self, fake_blob_service):
		url = blob_utils.upload_content_to_blob("テストcontent", "c1", "doc.txt")
		uploads = fake_blob_service["uploads"]
		
		assert url.endswith("/c1/doc.txt")
		assert len(uploads) == 1
		assert uploads[0]["data"] == "テストcontent".encode("utf-8")
		assert uploads[0]["overwrite"] is True

	def test_with_bytes(self, fake_blob_service):
		binary = b"\x00\x01imagebytes"
		
		url = blob_utils.upload_content_to_blob(binary, "c2", "img.bin")
		uploads = fake_blob_service["uploads"]
		
		assert url.endswith("/c2/img.bin")
		assert uploads[0]["data"] == binary

# ----------------------------------
# Tests: upload_file_to_blob
# ----------------------------------

class TestUploadFileToBlob:
	def test_upload_file(self, tmp_path: Path, fake_blob_service):
		file_path = tmp_path / "sample.bin"
		content = b"FILE-DATA-123"
		file_path.write_bytes(content)
		
		url = blob_utils.upload_file_to_blob(str(file_path), "c3", "uploaded.bin")
		uploads = [u for u in fake_blob_service["uploads"] if u["blob"] == "uploaded.bin"]
		
		assert url.endswith("/c3/uploaded.bin")
		assert uploads[0]["data"] == content


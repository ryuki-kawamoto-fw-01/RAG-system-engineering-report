import base64
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

import modules.file_prompt as target  # noqa: E402


def test_try_decode_uses_detected_encoding_when_valid():
    # N-01-001
    s = "hello"
    b = s.encode("utf-8")
    assert target._try_decode(b, "utf-8") == "hello"


def test_try_decode_shift_jis_branch_decodes(monkeypatch: pytest.MonkeyPatch):
    # L-01-001
    s = "abc"
    b = s.encode("shift_jis")
    assert target._try_decode(b, "shift_jis") == s


def test_try_decode_raises_when_all_decoders_fail():
    # E-01-001
    class _AllFail:
        def decode(self, enc):
            raise UnicodeDecodeError(enc, b"x", 0, 1, "boom")

    with pytest.raises(ValueError, match="エンコーディング"):
        target._try_decode(_AllFail(), None)  # type: ignore[arg-type]


def test_get_file_content_txt_decodes_using_chardet(monkeypatch: pytest.MonkeyPatch):
    # N-01-002
    monkeypatch.setattr(target.chardet, "detect", lambda b: {"encoding": "utf-8"})
    payload = base64.b64encode("hello".encode("utf-8")).decode("ascii")
    assert target.get_file_content(payload, "txt") == "hello"


def test_get_file_content_pdf_extracts_text(monkeypatch: pytest.MonkeyPatch):
    # N-01-003
    class _Page:
        def __init__(self, t):
            self._t = t

        def get_text(self):
            return self._t

    class _Doc(list):
        pass

    monkeypatch.setattr(target.fitz, "open", lambda **k: _Doc([_Page("p1"), _Page("p2")]))
    payload = base64.b64encode(b"%PDF").decode("ascii")
    assert target.get_file_content(payload, "pdf") == "p1p2"


def test_get_file_content_docx_extracts_paragraphs(monkeypatch: pytest.MonkeyPatch):
    # N-01-004
    class _Para:
        def __init__(self, text):
            self.text = text

    class _Doc:
        paragraphs = [_Para("a"), _Para("b")]

    monkeypatch.setattr(target.docx, "Document", lambda *_a, **_k: _Doc())
    payload = base64.b64encode(b"docx").decode("ascii")
    assert target.get_file_content(payload, "docx") == "a\n" + "b\n"


def test_get_file_content_xlsx_extracts_cells(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    class _Sheet:
        def iter_rows(self, values_only=False):
            assert values_only is True
            return [("x", None, 1), (None, "y", 2)]

    class _WB(list):
        pass

    monkeypatch.setattr(target.openpyxl, "load_workbook", lambda *_a, **_k: _WB([_Sheet()]))
    payload = base64.b64encode(b"xlsx").decode("ascii")
    out = target.get_file_content(payload, "xlsx")
    assert "x\t1" in out
    assert "y\t2" in out


def test_get_file_content_pptx_extracts_shapes_text(monkeypatch: pytest.MonkeyPatch):
    # N-01-005
    class _Shape:
        def __init__(self, text=None):
            if text is not None:
                self.text = text

    class _Slide:
        shapes = [_Shape("t1"), _Shape(None), _Shape("t2")]

    class _Pres:
        slides = [_Slide()]

    monkeypatch.setattr(target.pptx, "Presentation", lambda *_a, **_k: _Pres())
    payload = base64.b64encode(b"pptx").decode("ascii")
    out = target.get_file_content(payload, "pptx")
    assert "t1" in out and "t2" in out


def test_get_file_content_csv_decodes_and_joins_rows(monkeypatch: pytest.MonkeyPatch):
    # N-01-006
    monkeypatch.setattr(target.chardet, "detect", lambda b: {"encoding": "utf-8"})
    monkeypatch.setattr(target, "_try_decode", lambda content, enc: "a,b\nc,d")
    payload = base64.b64encode(b"csv").decode("ascii")
    assert target.get_file_content(payload, "csv") == "a,b\nc,d\n"


def test_get_file_content_msg_success_extracts_subject_body(monkeypatch: pytest.MonkeyPatch):
    # I-01-002
    class _Msg:
        def __init__(self, *a, **k):
            return None

        def get_properties(self):
            return {"Subject": "S", "Body": "B"}

    monkeypatch.setattr(target, "MsOxMessage", _Msg)
    payload = base64.b64encode(b"msg").decode("ascii")
    out = target.get_file_content(payload, "msg")
    assert "件名: S" in out
    assert "B" in out


def test_get_file_content_unsupported_extension_returns_empty_string():
    # L-01-002
    payload = base64.b64encode(b"abc").decode("ascii")
    assert target.get_file_content(payload, "bin") == ""


def test_get_file_content_msg_error_raises_value_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-002
    class _Boom:
        def __init__(self, *args, **kwargs):
            raise RuntimeError("fail")

    monkeypatch.setattr(target, "MsOxMessage", _Boom)

    payload = base64.b64encode(b"abc").decode("ascii")
    with pytest.raises(ValueError) as e:
        target.get_file_content(payload, "msg")

    assert "msgファイル" in str(e.value)


def test_get_file_content_non_msg_error_raises_value_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-003
    monkeypatch.setattr(target.base64, "b64decode", lambda *_a, **_k: (_ for _ in ()).throw(RuntimeError("x")))
    payload = base64.b64encode(b"abc").decode("ascii")
    with pytest.raises(ValueError) as e:
        target.get_file_content(payload, "pdf")
    assert "ファイルの読込に失敗" in str(e.value)

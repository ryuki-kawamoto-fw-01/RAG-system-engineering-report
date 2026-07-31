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

import modules.validation.common as target  # noqa: E402


class _PdfDoc:
    def __init__(self, encrypted: bool):
        self.is_encrypted = encrypted


def test_pdf_not_encrypted(monkeypatch):
    # N-01-001
    monkeypatch.setattr(target.fitz, "open", lambda **_: _PdfDoc(False))
    assert target.CommonValidation.is_encrypted(b"x", "pdf") is False


def test_pdf_open_error_returns_true(monkeypatch):
    # E-01-001
    def _raise(**_):
        raise RuntimeError("boom")

    monkeypatch.setattr(target.fitz, "open", _raise)
    assert target.CommonValidation.is_encrypted(b"x", "pdf") is True


def test_pptx_not_encrypted(monkeypatch):
    # N-01-002
    monkeypatch.setattr(target.pptx, "Presentation", lambda *_: object())
    assert target.CommonValidation.is_encrypted(b"x", "pptx") is False


def test_pptx_open_error_returns_true(monkeypatch):
    # E-01-002
    def _raise(*_):
        raise RuntimeError("boom")

    monkeypatch.setattr(target.pptx, "Presentation", _raise)
    assert target.CommonValidation.is_encrypted(b"x", "pptx") is True


def test_msg_not_encrypted(monkeypatch):
    # N-01-003
    class _Msg:
        subject = "s"
        body = "b"

    monkeypatch.setattr(target, "MsOxMessage", lambda *_: _Msg())
    monkeypatch.setattr(target.logging, "info", lambda *_: None)
    assert target.CommonValidation.is_encrypted(b"x", "msg") is False


def test_msg_open_error_returns_true(monkeypatch):
    # E-01-003
    def _raise(*_):
        raise RuntimeError("boom")

    monkeypatch.setattr(target, "MsOxMessage", _raise)
    assert target.CommonValidation.is_encrypted(b"x", "msg") is True


def test_xlsx_not_encrypted(monkeypatch):
    # N-01-004
    monkeypatch.setattr(target.openpyxl, "load_workbook", lambda *_: object())
    assert target.CommonValidation.is_encrypted(b"x", "xlsx") is False


def test_xlsx_open_error_returns_true(monkeypatch):
    # E-01-004
    def _raise(*_):
        raise RuntimeError("boom")

    monkeypatch.setattr(target.openpyxl, "load_workbook", _raise)
    assert target.CommonValidation.is_encrypted(b"x", "xlsx") is True


def test_docx_not_encrypted(monkeypatch):
    # N-01-005
    monkeypatch.setattr(target.docx, "Document", lambda *_: object())
    assert target.CommonValidation.is_encrypted(b"x", "docx") is False


def test_docx_open_error_returns_true(monkeypatch):
    # E-01-005
    def _raise(*_):
        raise RuntimeError("boom")

    monkeypatch.setattr(target.docx, "Document", _raise)
    assert target.CommonValidation.is_encrypted(b"x", "docx") is True


def test_unknown_extension_returns_false():
    # L-01-001
    assert target.CommonValidation.is_encrypted(b"x", "txt") is False


def test_extension_is_case_sensitive_returns_false():
    # L-01-002
    assert target.CommonValidation.is_encrypted(b"x", "PDF") is False


def test_multiple_extensions_in_sequence(monkeypatch):
    # I-01-001
    monkeypatch.setattr(target.fitz, "open", lambda **_: _PdfDoc(False))
    monkeypatch.setattr(target.docx, "Document", lambda *_: object())
    assert target.CommonValidation.is_encrypted(b"x", "pdf") is False
    assert target.CommonValidation.is_encrypted(b"x", "docx") is False

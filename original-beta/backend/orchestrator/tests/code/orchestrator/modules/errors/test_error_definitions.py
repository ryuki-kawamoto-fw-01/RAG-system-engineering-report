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

import modules.errors.error_definitions as target  # noqa: E402

EXPECTED_KEYS = {
    "E_B1_00010",
    "E_B1_00020",
    "E_B1_00030",
    "E_B1_00040",
    "E_B1_00050",
    "E_B1_00060",
    "E_B1_00070",
    "E_B1_00080",
    "E_B1_00090",
    "E_B1_00100",
    "E_B1_00110",
    "E_B1_00120",
    "E_B1_00130",
}


def test_error_messages_has_expected_keys_and_values():
    # N-01-001
    assert set(target.ERROR_MESSAGES.keys()) == EXPECTED_KEYS
    assert all(isinstance(v, str) and v for v in target.ERROR_MESSAGES.values())


def test_error_messages_missing_key_raises_key_error():
    # E-01-001
    with pytest.raises(KeyError):
        _ = target.ERROR_MESSAGES["E_B1_99999"]


def test_error_message_format_missing_required_placeholder_raises():
    # E-01-002
    with pytest.raises(KeyError):
        _ = target.ERROR_MESSAGES["E_B1_00010"].format()


def test_error_message_format_with_value_inserts_payload():
    # L-01-001
    rendered = target.ERROR_MESSAGES["E_B1_00010"].format(value="")
    assert "" in rendered


def test_error_message_format_with_empty_filter_reasons_removes_placeholder():
    # L-01-002
    rendered = target.ERROR_MESSAGES["E_B1_00090"].format(filter_reasons="")
    assert "{filter_reasons}" not in rendered


def test_error_message_format_with_filter_reasons_inserts_payload():
    # I-01-001
    rendered = target.ERROR_MESSAGES["E_B1_00090"].format(filter_reasons="policy")
    assert "policy" in rendered


def test_error_messages_include_expected_placeholders():
    # N-01-002
    message_with_value = target.ERROR_MESSAGES["E_B1_00020"]
    message_with_filter = target.ERROR_MESSAGES["E_B1_00090"]
    assert "{value}" in message_with_value
    assert "{filter_reasons}" in message_with_filter

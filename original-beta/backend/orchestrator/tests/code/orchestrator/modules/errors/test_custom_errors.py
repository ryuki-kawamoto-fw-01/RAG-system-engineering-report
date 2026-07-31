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

import modules.errors.custom_errors as target  # noqa: E402
import modules.errors.error_definitions as error_defs  # noqa: E402


def test_llm_specific_error_stores_error_id_and_kwargs():
    # N-01-001
    err = target.LLMSpecificError("E_B1_00010", value="summary")
    assert err.error_id == "E_B1_00010"
    assert err.fmt_kwargs == {"value": "summary"}
    assert err.args == ("E_B1_00010", {"value": "summary"})


def test_llm_specific_error_can_be_raised_and_caught():
    # E-01-001
    with pytest.raises(target.LLMSpecificError) as exc_info:
        raise target.LLMSpecificError("E_B1_00020", value="content")
    assert exc_info.value.error_id == "E_B1_00020"
    assert exc_info.value.fmt_kwargs == {"value": "content"}


def test_llm_specific_error_accepts_empty_error_id():
    # L-01-001
    err = target.LLMSpecificError("")
    assert err.error_id == ""
    assert err.fmt_kwargs == {}


def test_llm_specific_error_formats_message_with_error_definitions():
    # I-01-001
    err = target.LLMSpecificError("E_B1_00090", filter_reasons="policy")
    template = error_defs.ERROR_MESSAGES[err.error_id]
    rendered = template.format(**err.fmt_kwargs)
    assert "policy" in rendered

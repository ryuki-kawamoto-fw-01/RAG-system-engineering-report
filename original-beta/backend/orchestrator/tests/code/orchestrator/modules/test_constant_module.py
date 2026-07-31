import json
import re
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

import modules.constant as target  # noqa: E402


def test_knowledge_cutoff_dict_has_expected_keys_and_date_format():
    # N-01-001
    assert set(target.knowledge_cutoff_dict.keys()) == {"gpt-5.2", "gpt-5.2-reasoning", "gpt-4.1"}
    for v in target.knowledge_cutoff_dict.values():
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", v)


def test_knowledge_cutoff_dict_missing_key_raises_key_error():
    # E-01-001
    with pytest.raises(KeyError):
        _ = target.knowledge_cutoff_dict["missing"]


def test_knowledge_cutoff_dict_values_have_fixed_length():
    # L-01-001
    for v in target.knowledge_cutoff_dict.values():
        assert len(v) == 10


def test_knowledge_cutoff_dict_is_json_serializable_roundtrip():
    # I-01-001
    s = json.dumps(target.knowledge_cutoff_dict)
    loaded = json.loads(s)
    assert loaded["gpt-5.2"] == target.knowledge_cutoff_dict["gpt-5.2"]


def test_knowledge_cutoff_dict_values_are_non_empty_strings():
    # N-01-002
    assert all(isinstance(v, str) and v for v in target.knowledge_cutoff_dict.values())

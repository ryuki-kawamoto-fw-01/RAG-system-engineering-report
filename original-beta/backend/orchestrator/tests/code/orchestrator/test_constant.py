import re
import sys
from pathlib import Path


def _add_orchestrator_to_syspath() -> None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "backend" / "orchestrator"
        if (candidate / "constant.py").exists():
            sys.path.insert(0, str(candidate))
            return
    raise RuntimeError("Could not locate backend/orchestrator to add to sys.path")


_add_orchestrator_to_syspath()

import constant as target  # noqa: E402


def test_knowledge_cutoff_dict_has_expected_models_and_date_format():
    # N-01-001
    assert "gpt-5.2" in target.knowledge_cutoff_dict
    assert "gpt-5.2-reasoning" in target.knowledge_cutoff_dict
    assert "gpt-4.1" in target.knowledge_cutoff_dict

    for value in target.knowledge_cutoff_dict.values():
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", value)

import os
import sys
from pathlib import Path


def _add_orchestrator_to_syspath() -> None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "function_app.py").exists():
            sys.path.insert(0, str(parent))
            return
    raise RuntimeError("Could not locate backend/orchestrator to add to sys.path")


_add_orchestrator_to_syspath()

# Import-time dependencies for some modules require these defaults.
os.environ.setdefault("MODEL_IDENTIFIER", "test")
os.environ.setdefault("LOAD_BALANCER_ENDPOINT", "https://example")
os.environ.setdefault("AZURE_OPENAI_VERSION", "2024-10-21")

from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class CollectedData(BaseModel):
    """Schema to hold data collected within a specific context (function)."""

    function_name: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)

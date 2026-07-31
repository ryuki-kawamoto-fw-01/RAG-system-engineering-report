from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SummaryPostRequest(BaseModel):
    content: str = Field(..., title="text")
    summaryLength: Optional[int] = Field(..., title="サマリーの長さ")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("content", mode="before")
    @classmethod
    def validate_content(cls, v):
        if v is None:
            raise ValueError("textは必須です")
        return v

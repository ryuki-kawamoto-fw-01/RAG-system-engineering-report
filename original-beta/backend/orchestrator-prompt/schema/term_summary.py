from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TermSummaryPostRequest(BaseModel):
    domain: str = Field(..., title="解説してほしい用語の分野")
    content: str = Field(..., title="要約したい文章")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("domain", mode="before")
    @classmethod
    def validate_domain(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("domainは必須です")
        return v.strip()

    @field_validator("content", mode="before")
    @classmethod
    def validate_content(cls, v):
        if v is None:
            raise ValueError("contentは必須です")
        return v

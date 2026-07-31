from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CreateDesignDocumentPostRequest(BaseModel):
    product: str = Field(title="製品")
    purpose: str = Field(title="用途・目的")
    feature: str = Field(title="機能")
    considerations: Optional[str] = Field(None, title="考慮事項")

    @field_validator("product", mode="before")
    @classmethod
    def validate_product(cls, v):
        if not v:
            raise ValueError("製品名は必須です")
        return v

    @field_validator("purpose", mode="before")
    @classmethod
    def validate_purpose(cls, v):
        if not v:
            raise ValueError("用途・目的は必須です")
        return v

    @field_validator("feature", mode="before")
    @classmethod
    def validate_feature(cls, v):
        if not v:
            raise ValueError("機能は必須です")
        return v


class CreateNewDesignDocumentPostRequest(BaseModel):
    result: str = Field(..., title="既存のアイデア")
    newIdeaRequest: str = Field(..., title="追加のアイデア")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("newIdeaRequest", mode="before")
    @classmethod
    def validate_newIdeaRequest(cls, v):
        if v is None:
            raise ValueError("new_idea_requestは必須です")
        return v

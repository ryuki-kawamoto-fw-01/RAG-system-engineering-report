from typing import Optional

from pydantic import BaseModel, Field, field_validator


class IdeaPostRequest(BaseModel):
    ideationSubject: str = Field(..., title="主題")
    ideationRole: str = Field(..., title="立場")
    ideationCount: int = Field(..., title="アイデアの件数")
    ideationConsideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("ideationSubject", mode="before")
    @classmethod
    def validate_ideation_subject(cls, v):
        if v is None:
            raise ValueError("ideation_subjectは必須です")
        return v

    @field_validator("ideationRole", mode="before")
    @classmethod
    def validate_ideation_role(cls, v):
        if v is None:
            raise ValueError("ideation_roleは必須です")
        return v

    @field_validator("ideationCount", mode="before")
    @classmethod
    def validate_ideation_count(cls, v):
        if v is None:
            raise ValueError("ideation_countは必須です")
        return v


class IdeaNewPostRequest(BaseModel):
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

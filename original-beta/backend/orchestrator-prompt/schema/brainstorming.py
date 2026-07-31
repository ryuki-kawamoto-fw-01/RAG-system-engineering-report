from pydantic import BaseModel, Field, field_validator


class BrainstormingPostRequest(BaseModel):
    theme: str = Field(title="メインテーマ")
    expert1: str = Field(title="専門家１")
    expert2: str = Field(title="専門家２")

    @field_validator("theme", mode="before")
    @classmethod
    def validate_theme(cls, v):
        if not v:
            raise ValueError("メインテーマは必須です")
        return v

    @field_validator("expert1", mode="before")
    @classmethod
    def validate_expert1(cls, v):
        if not v:
            raise ValueError("専門家１は必須です")
        return v

    @field_validator("expert2", mode="before")
    @classmethod
    def validate_expert2(cls, v):
        if not v:
            raise ValueError("専門家２は必須です")
        return v


class NewBrainstormingPostRequest(BaseModel):
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

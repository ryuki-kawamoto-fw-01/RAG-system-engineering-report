from typing import List, Literal

from pydantic import BaseModel, Field, field_validator


class WallHittingPostRequest(BaseModel):
    theme: str = Field(..., title="テーマ")
    idea: str = Field(..., title="アイデア")

    @field_validator("theme", mode="before")
    @classmethod
    def validate_theme(cls, v):
        if v is None:
            raise ValueError("themeは必須です")
        return v

    @field_validator("idea", mode="before")
    @classmethod
    def validate_idea(cls, v):
        if v is None:
            raise ValueError("ideaは必須です")
        return v


# 追加: チャット用リクエストスキーマ
class WallHittingChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class WallHittingChatPostRequest(BaseModel):
    question: str = Field(..., title="ユーザー質問")
    chatHistory: List[WallHittingChatMessage] = Field(
        default_factory=list, title="チャット履歴"
    )

    @field_validator("question", mode="before")
    @classmethod
    def validate_question(cls, v):
        if not v:
            raise ValueError("questionは必須です")
        return v

from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TaskBreakdownRequest(BaseModel):
    task: str = Field(..., title="タスク分解したい業務")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("task", mode="before")
    @classmethod
    def validate_task(cls, v):
        if v is None:
            raise ValueError("taskは必須です")
        return v


class FixTaskBreakdownRequest(BaseModel):
    result: str = Field(..., title="作成結果")
    revisionPrompt: str = Field(..., title="結果調整プロンプト")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("revisionPrompt", mode="before")
    @classmethod
    def validate_revisionPrompt(cls, v):
        if v is None:
            raise ValueError("revisionPromptは必須です")
        return v

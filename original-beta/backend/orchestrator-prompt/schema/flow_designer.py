from typing import Optional

from pydantic import BaseModel, Field, field_validator


class FlowDesignerPostRequest(BaseModel):
    text: str = Field(..., title="製造工程情報")
    type: str = Field(..., title="作成する工程管理表の種類")
    consideration: Optional[str] = Field(..., title="考慮事項")


class FixFlowDesignerPostRequest(BaseModel):
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

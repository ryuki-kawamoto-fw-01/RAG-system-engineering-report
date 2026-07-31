from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class CreateMinutesPostRequest(BaseModel):
    meeting_purpose: str = Field(..., title="会議の目的")


class FixMinutesPostRequest(BaseModel):
    result_minutes: Optional[str] = Field(..., title="作成された議事録")
    revision_prompt: str = Field(..., title="修正事項")

    @field_validator("result_minutes", mode="before")
    @classmethod
    def validate_result_minutes(cls, v):
        if v is None:
            raise ValueError("作成結果は必須です")
        return v

    @field_validator("revision_prompt", mode="before")
    @classmethod
    def validate_revision_prompt(cls, v):
        if v is None:
            raise ValueError("修正事項は必須です")
        return v

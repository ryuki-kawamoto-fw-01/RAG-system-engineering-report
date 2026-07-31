from typing import Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class TextCorrectionPostRequest(BaseModel):
    documentType: str = Field(..., title="文章用途")
    checkpoints: str = Field(..., title="文章チェック観点")
    text: Optional[str] = Field(..., title="文章")
    additionalConsiderations: Optional[str] = Field(..., title="考慮事項")

    @field_validator("documentType", mode="before")
    @classmethod
    def validate_documentType(cls, v):
        if v is None:
            raise ValueError("文章用途は必須です")
        return v

    @field_validator("checkpoints", mode="before")
    @classmethod
    def validate_checkpoints(cls, v):
        if v is None:
            raise ValueError("文章チェック観点は必須です")
        return v

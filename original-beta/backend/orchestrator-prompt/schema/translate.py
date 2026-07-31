from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TranslatePostRequest(BaseModel):
    text: str = Field(..., title="文章")
    sourceLanguage: Optional[str] = Field(..., title="翻訳したい言語")
    targetLanguage: str = Field(..., title="翻訳する言語")
    considerations: Optional[str] = Field(..., title="考慮事項")

    @field_validator("text", mode="before")
    @classmethod
    def validate_text(cls, v):
        if v is None:
            raise ValueError("textは必須です")
        return v

    @field_validator("targetLanguage", mode="before")
    @classmethod
    def validate_target_language(cls, v):
        if v is None:
            raise ValueError("target_languageは必須です")
        return v

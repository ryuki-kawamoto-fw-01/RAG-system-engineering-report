from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ErrorAnalysisPostRequest(BaseModel):
    programmingLanguage: str = Field(..., title="プログラミング言語")
    errorMessage: str = Field(..., title="エラーメッセージ")
    considerations: Optional[str] = Field(None, title="考慮事項")

    @field_validator("programmingLanguage", mode="before")
    @classmethod
    def validate_programmingLanguage(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("プログラミング言語は必須です")
        return v

    @field_validator("errorMessage", mode="before")
    @classmethod
    def validate_errorMessage(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("エラーメッセージは必須です")
        return v


class ErrorAnalysisPostResponse(BaseModel):
    explanation: str = Field(..., title="エラーの説明")
    solutionAndExample: str = Field(..., title="解決策と修正例")
    success: bool = Field(..., title="成功フラグ")

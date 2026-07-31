from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SupposedQuestionPostRequest(BaseModel):
    description: str = Field(..., title="目的")
    consideration: Optional[str] = Field(..., title="考慮事項")
    specialty: int = Field(..., title="専門性")
    interest: int = Field(..., title="興味")
    intimacy: int = Field(..., title="親密度")

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v):
        if v is None:
            raise ValueError("descriptionは必須です")
        return v

    @field_validator("specialty", mode="before")
    @classmethod
    def validate_specialty(cls, v):
        if v is None:
            raise ValueError("specialtyは必須です")
        return v

    @field_validator("interest", mode="before")
    @classmethod
    def validate_interest(cls, v):
        if v is None:
            raise ValueError("interestは必須です")
        return v

    @field_validator("intimacy", mode="before")
    @classmethod
    def validate_intimacy(cls, v):
        if v is None:
            raise ValueError("intimacyは必須です")
        return v


class ModifySupposedQuestionPostRequest(BaseModel):
    description: str = Field(..., title="入力メッセージ")
    qa_list: list = Field(..., title="会話履歴")
    temp_file: str = Field(..., title="提案書")

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v):
        if v is None:
            raise ValueError("descriptionは必須です")
        return v

    @field_validator("qa_list", mode="before")
    @classmethod
    def validate_qa_list(cls, v):
        if len(v) <= 0:
            raise ValueError("qa_listは必須です")
        return v

    @field_validator("temp_file", mode="before")
    @classmethod
    def validate_temp_file(cls, v):
        if v is None:
            raise ValueError("temp_fileは必須です")
        return v

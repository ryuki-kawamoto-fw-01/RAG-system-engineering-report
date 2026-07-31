from typing import Optional

from pydantic import BaseModel, Field, field_validator


class NeedsSurveyServicePostRequest(BaseModel):
    industry: str = Field(title="業界・市場の種類")
    purpose: str = Field(title="調査の目的")
    product: str = Field(title="商品・サービスの概要")
    persona: str = Field(title="顧客ペルソナ")
    additionalConsiderations: Optional[str] = Field(None, title="考慮事項")

    @field_validator("industry", mode="before")
    @classmethod
    def validate_industry(cls, v):
        if not v:
            raise ValueError("業界・市場の種類は必須です")
        return v

    @field_validator("purpose", mode="before")
    @classmethod
    def validate_purpose(cls, v):
        if not v:
            raise ValueError("調査の目的は必須です")
        return v

    @field_validator("product", mode="before")
    @classmethod
    def validate_product(cls, v):
        if not v:
            raise ValueError("商品・サービスの概要は必須です")
        return v

    @field_validator("persona", mode="before")
    @classmethod
    def validate_persona(cls, v):
        if not v:
            raise ValueError("顧客ペルソナは必須です")
        return v


class NewNeedsSurveyServicePostRequest(BaseModel):
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
    def validate_newSurveyRequest(cls, v):
        if v is None:
            raise ValueError("new_survey_requestは必須です")
        return v

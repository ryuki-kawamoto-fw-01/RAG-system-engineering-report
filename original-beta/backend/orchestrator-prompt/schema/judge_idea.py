from typing import Optional

from pydantic import BaseModel, Field, field_validator


class JudgeIdeaPostRequest(BaseModel):
    ideationFunction: str = Field(..., title="機能")
    ideationUse: str = Field(..., title="用途")
    ideationMarket: str = Field(..., title="市場")
    ideationCountry: str = Field(..., title="地域")

    @field_validator("ideationFunction", mode="before")
    @classmethod
    def validate_ideation_function(cls, v):
        if v is None:
            raise ValueError("ideation_functionは必須です")
        return v

    @field_validator("ideationUse", mode="before")
    @classmethod
    def validate_ideation_use(cls, v):
        if v is None:
            raise ValueError("ideation_useは必須です")
        return v

    @field_validator("ideationMarket", mode="before")
    @classmethod
    def validate_ideation_market(cls, v):
        if v is None:
            raise ValueError("ideation_marketは必須です")
        return v

    @field_validator("ideationCountry", mode="before")
    @classmethod
    def validate_ideation_country(cls, v):
        if v is None:
            raise ValueError("ideation_countryは必須です")
        return v


class JudgeNewIdeaPostRequest(BaseModel):
    result: str = Field(..., title="評価結果")
    newJudgeRequest: str = Field(..., title="修正事項")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("newJudgeRequest", mode="before")
    @classmethod
    def validate_newJudgeRequest(cls, v):
        if v is None:
            raise ValueError("new_idea_requestは必須です")
        return v

from typing import Optional

from pydantic import BaseModel, Field, field_validator


class MarketResearchPostRequest(BaseModel):
    market: str = Field(..., title="市場")
    competitor: str = Field(..., title="競合")
    targetCustomer: str = Field(..., title="ターゲット顧客")
    purpose: str = Field(..., title="目的")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("market", mode="before")
    @classmethod
    def validate_market(cls, v):
        if v is None:
            raise ValueError("marketは必須です")
        return v

    @field_validator("competitor", mode="before")
    @classmethod
    def validate_competitor(cls, v):
        if v is None:
            raise ValueError("competitorは必須です")
        return v

    @field_validator("targetCustomer", mode="before")
    @classmethod
    def validate_target_customer(cls, v):
        if v is None:
            raise ValueError("targetCustomerは必須です")
        return v

    @field_validator("purpose", mode="before")
    @classmethod
    def validate_purpose(cls, v):
        if v is None:
            raise ValueError("purposeは必須です")
        return v


class ReportFixPostRequest(BaseModel):
    result: str = Field(..., title="既存のレポート")
    prev_market: str = Field(..., title="前回の市場")
    prev_competitor: str = Field(..., title="前回の競合")
    prev_target: str = Field(..., title="前回のターゲット")
    prev_purpose: str = Field(..., title="前回の目的")
    prev_consideration: Optional[str] = Field("", title="前回の考慮事項")
    market: str = Field(..., title="市場")
    competitor: str = Field(..., title="競合")
    target: str = Field(..., title="ターゲット")
    purpose: str = Field(..., title="目的")
    consideration: Optional[str] = Field("", title="考慮事項")


    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("prev_market", mode="before")
    @classmethod
    def validate_prev_market(cls, v):
        if v is None:
            raise ValueError("prev_marketは必須です")
        return v

    @field_validator("prev_competitor", mode="before")
    @classmethod
    def validate_prev_competitor(cls, v):
        if v is None:
            raise ValueError("prev_competitorは必須です")
        return v

    @field_validator("prev_target", mode="before")
    @classmethod
    def validate_prev_target(cls, v):
        if v is None:
            raise ValueError("prev_targetは必須です")
        return v

    @field_validator("prev_purpose", mode="before")
    @classmethod
    def validate_prev_purpose(cls, v):
        if v is None:
            raise ValueError("prev_purposeは必須です")
        return v

    @field_validator("market", mode="before")
    @classmethod
    def validate_market(cls, v):
        if v is None:
            raise ValueError("marketは必須です")
        return v

    @field_validator("competitor", mode="before")
    @classmethod
    def validate_competitor(cls, v):
        if v is None:
            raise ValueError("competitorは必須です")
        return v

    @field_validator("target", mode="before")
    @classmethod
    def validate_target(cls, v):
        if v is None:
            raise ValueError("targetは必須です")
        return v

    @field_validator("purpose", mode="before")
    @classmethod
    def validate_purpose(cls, v):
        if v is None:
            raise ValueError("purposeは必須です")
        return v
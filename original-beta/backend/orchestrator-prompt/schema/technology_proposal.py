from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TechnologyProposalPostRequest(BaseModel):
    technologyName: str = Field(..., title="新技術名")
    market: str = Field(..., title="市場")
    current_Issues: str = Field(..., title="現状と課題")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("technologyName", mode="before")
    @classmethod
    def validate_technologyName(cls, v):
        if v is None:
            raise ValueError("technologyNameは必須です")
        return v

    @field_validator("market", mode="before")
    @classmethod
    def validate_market(cls, v):
        if v is None:
            raise ValueError("marketは必須です")
        return v

    @field_validator("current_Issues", mode="before")
    @classmethod
    def validate_current_Issues(cls, v):
        if v is None:
            raise ValueError("current_Issuesは必須です")
        return v


class FixTechnologyProposalPostRequest(BaseModel):
    result: str = Field(..., title="作成結果")
    modify: str = Field(..., title="修正事項")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("modify", mode="before")
    @classmethod
    def validate_modify(cls, v):
        if v is None:
            raise ValueError("modifyは必須です")
        return v


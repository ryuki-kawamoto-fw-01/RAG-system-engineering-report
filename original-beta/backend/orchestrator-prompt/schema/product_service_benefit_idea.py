from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ProductServiceBenefitIdeaPostRequest(BaseModel):
    product: str = Field(..., title="製品")
    features: str = Field(..., title="製品の特長")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("product", mode="before")
    @classmethod
    def validate_product(cls, v):
        if v is None:
            raise ValueError("productは必須です")
        return v

    @field_validator("features", mode="before")
    @classmethod
    def validate_features(cls, v):
        if v is None:
            raise ValueError("featuresは必須です")
        return v


class ProductServiceBenefitNewIdeaPostRequest(BaseModel):
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
    def validate_newIdeaRequest(cls, v):
        if v is None:
            raise ValueError("new_idea_requestは必須です")
        return v

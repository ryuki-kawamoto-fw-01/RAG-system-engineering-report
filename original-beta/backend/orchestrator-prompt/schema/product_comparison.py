from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class ProductComparisonPostRequest(BaseModel):
    products: List[str] = Field(..., title="製品名リスト")
    purpose: str = Field(..., title="用途・目的")
    considerations: Optional[str] = Field(None, title="考慮事項")

    @field_validator("products", mode="before")
    @classmethod
    def validate_products(cls, v):
        if not v or len(v) < 2:
            raise ValueError("比較する製品を2つ以上入力してください")
        return v

    @field_validator("purpose", mode="before")
    @classmethod
    def validate_purpose(cls, v):
        if not v:
            raise ValueError("用途・目的は必須です")
        return v


class ProductComparisonReanalysisRequest(BaseModel):
    products: List[str] = Field(..., title="製品名リスト")
    existing_comparison: str = Field(..., title="既存の比較結果")
    additional_request: str = Field(..., title="追加の比較観点")

    @field_validator("products", mode="before")
    @classmethod
    def validate_products(cls, v):
        if not v or len(v) < 2:
            raise ValueError("比較する製品を2つ以上入力してください")
        return v

    @field_validator("existing_comparison", mode="before")
    @classmethod
    def validate_existing_comparison(cls, v):
        if not v:
            raise ValueError("既存の比較結果は必須です")
        return v

    @field_validator("additional_request", mode="before")
    @classmethod
    def validate_additional_request(cls, v):
        if not v:
            raise ValueError("追加の比較観点は必須です")
        return v

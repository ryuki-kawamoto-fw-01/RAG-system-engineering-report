from typing import Optional

from pydantic import BaseModel, Field, field_validator


class NewProductProposalPostRequest(BaseModel):
    productName: str = Field(..., title="製品名")
    productMarket: str = Field(..., title="製品の市場")
    targetCustomer: str = Field(..., title="ターゲット顧客")
    concept: str = Field(..., title="新製品のコンセプト")
    comparisonPoints: str = Field(..., title="他社製品との比較")
    consideration: Optional[str] = Field("", title="考慮事項")

    @field_validator("productName", mode="before")
    @classmethod
    def validate_market(cls, v):
        if v is None:
            raise ValueError("productNameは必須です")
        return v

    @field_validator("productMarket", mode="before")
    @classmethod
    def validate_product_market(cls, v):
        if v is None:
            raise ValueError("productMarketは必須です")
        return v

    @field_validator("targetCustomer", mode="before")
    @classmethod
    def validate_target_customer(cls, v):
        if v is None:
            raise ValueError("targetCustomerは必須です")
        return v

    @field_validator("concept", mode="before")
    @classmethod
    def validate_concept(cls, v):
        if v is None:
            raise ValueError("conceptは必須です")
        return v

    @field_validator("comparisonPoints", mode="before")
    @classmethod
    def validate_comparison_points(cls, v):
        if v is None:
            raise ValueError("comparisonPointsは必須です")
        return v


class NewProductProposalFixPostRequest(BaseModel):
    result: str = Field(..., title="既存のレポート")
    prev_productName: str = Field(..., title="前回の製品名")
    prev_productMarket: str = Field(..., title="前回の製品の市場")
    prev_targetCustomer: str = Field(..., title="前回のターゲット顧客")
    prev_concept: str = Field(..., title="前回の新製品コンセプト")
    prev_comparisonPoints: str = Field(..., title="前回の他社製品との比較")
    prev_consideration: Optional[str] = Field("", title="前回の考慮事項")
    productName: str = Field(..., title="製品名")
    productMarket: str = Field(..., title="製品の市場")
    targetCustomer: str = Field(..., title="ターゲット顧客")
    concept: str = Field(..., title="新製品のコンセプト")
    comparisonPoints: str = Field(..., title="前回の他社製品との比較")
    consideration: Optional[str] = Field("", title="考慮事項")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("prev_productName", mode="before")
    @classmethod
    def validate_prev_productName(cls, v):
        if v is None:
            raise ValueError("prev_productNameは必須です")
        return v

    @field_validator("prev_productMarket", mode="before")
    @classmethod
    def validate_prev_productMarket(cls, v):
        if v is None:
            raise ValueError("prev_productMarketは必須です")
        return v

    @field_validator("prev_targetCustomer", mode="before")
    @classmethod
    def validate_prev_targetCustomer(cls, v):
        if v is None:
            raise ValueError("prev_targetCustomerは必須です")
        return v

    @field_validator("prev_concept", mode="before")
    @classmethod
    def validate_prev_concept(cls, v):
        if v is None:
            raise ValueError("prev_conceptは必須です")
        return v

    @field_validator("prev_comparisonPoints", mode="before")
    @classmethod
    def validate_prev_comparisonPoints(cls, v):
        if v is None:
            raise ValueError("prev_comparisonPointsは必須です")
        return v

    @field_validator("productName", mode="before")
    @classmethod
    def validate_productName(cls, v):
        if v is None:
            raise ValueError("productNameは必須です")
        return v

    @field_validator("productMarket", mode="before")
    @classmethod
    def validate_productMarket(cls, v):
        if v is None:
            raise ValueError("productMarketは必須です")
        return v

    @field_validator("targetCustomer", mode="before")
    @classmethod
    def validate_targetCustomer(cls, v):
        if v is None:
            raise ValueError("targetCustomerは必須です")
        return v

    @field_validator("concept", mode="before")
    @classmethod
    def validate_concept(cls, v):
        if v is None:
            raise ValueError("conceptは必須です")
        return v

    @field_validator("comparisonPoints", mode="before")
    @classmethod
    def validate_comparisonPoints(cls, v):
        if v is None:
            raise ValueError("comparisonPointsは必須です")
        return v

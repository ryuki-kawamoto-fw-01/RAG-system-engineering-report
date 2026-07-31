from pydantic import BaseModel, Field, field_validator


class ProductPromotionStrategyPostRequest(BaseModel):
    productDescription: str = Field(..., title="製品説明")
    targetMarket: str = Field(..., title="主なターゲット市場")
    differentiationPoint: str = Field(..., title="競合との差別化ポイント")
    promotionTools: str = Field(..., title="考えている販促ツール")
    salesChannels: str = Field(..., title="主な販売チャネル")

    @field_validator("productDescription", mode="before")
    @classmethod
    def validate_product_description(cls, v):
        if v is None or not v.strip():
            raise ValueError("製品説明は必須です")
        return v

    @field_validator("targetMarket", mode="before")
    @classmethod
    def validate_target_market(cls, v):
        if v is None or not v.strip():
            raise ValueError("主なターゲット市場は必須です")
        return v

    @field_validator("differentiationPoint", mode="before")
    @classmethod
    def validate_differentiation_point(cls, v):
        if v is None or not v.strip():
            raise ValueError("競合との差別化ポイントは必須です")
        return v

    @field_validator("promotionTools", mode="before")
    @classmethod
    def validate_promotion_tools(cls, v):
        if v is None or not v.strip():
            raise ValueError("考えている販促ツールは必須です")
        return v

    @field_validator("salesChannels", mode="before")
    @classmethod
    def validate_sales_channels(cls, v):
        if v is None or not v.strip():
            raise ValueError("主な販売チャネルは必須です")
        return v

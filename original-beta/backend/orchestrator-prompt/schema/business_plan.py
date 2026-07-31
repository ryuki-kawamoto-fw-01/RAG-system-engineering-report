from pydantic import BaseModel, Field, field_validator


class BusinessPlanPostRequest(BaseModel):
    businessName: str = Field(..., title="事業名")
    businessPurpose: str = Field(..., title="事業の目的・背景・解決する課題")
    targetMarket: str = Field(..., title="ターゲット市場・顧客層")
    businessModel: str = Field(..., title="収益モデル・事業の仕組み")
    competitiveAdvantage: str = Field(..., title="競合優位性・独自性")
    financialProjection: str = Field(..., title="財務計画・収支予測")

    @field_validator("businessName", mode="before")
    @classmethod
    def validate_business_name(cls, v):
        if not v:
            raise ValueError("事業名は必須です")
        return v

    @field_validator("businessPurpose", mode="before")
    @classmethod
    def validate_business_purpose(cls, v):
        if not v:
            raise ValueError("事業の目的・背景・解決する課題は必須です")
        return v

    @field_validator("targetMarket", mode="before")
    @classmethod
    def validate_target_market(cls, v):
        if not v:
            raise ValueError("ターゲット市場・顧客層は必須です")
        return v

    @field_validator("businessModel", mode="before")
    @classmethod
    def validate_business_model(cls, v):
        if not v:
            raise ValueError("収益モデル・事業の仕組みは必須です")
        return v

    @field_validator("competitiveAdvantage", mode="before")
    @classmethod
    def validate_competitive_advantage(cls, v):
        if not v:
            raise ValueError("競合優位性・独自性は必須です")
        return v

    @field_validator("financialProjection", mode="before")
    @classmethod
    def validate_financial_projection(cls, v):
        if not v:
            raise ValueError("財務計画・収支予測は必須です")
        return v


class BusinessPlanNewPostRequest(BaseModel):
    result: str = Field(..., title="既存の出力")
    newBusinessPlanRequest: str = Field(..., title="追加の要件")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("newBusinessPlanRequest", mode="before")
    @classmethod
    def validate_newBusinessPlanRequest(cls, v):
        if v is None:
            raise ValueError("new_business_plan_requestは必須です")
        return v

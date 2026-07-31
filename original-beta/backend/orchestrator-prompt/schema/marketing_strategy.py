from pydantic import BaseModel, Field, field_validator


class MarketingStrategyPostRequest(BaseModel):
    MarketSize: str = Field(title="市場規模")
    GrowthRate: str = Field(title="成長率")
    KeyPlayer: str = Field(title="主要プレイヤー")
    Competitors: str = Field(title="競合製品の特長や価格")
    CustomerAttributes: str = Field(title="顧客属性")
    PurchasingBehavior: str = Field(title="購買行動や嗜好")

    @field_validator("MarketSize", mode="before")
    @classmethod
    def validate_marketSize(cls, v):
        if not v:
            raise ValueError("市場規模は必須です")
        return v

    @field_validator("GrowthRate", mode="before")
    @classmethod
    def validate_growthRate(cls, v):
        if not v:
            raise ValueError("成長率は必須です")
        return v

    @field_validator("KeyPlayer", mode="before")
    @classmethod
    def validate_keyPlayer(cls, v):
        if not v:
            raise ValueError("主要プレイヤーは必須です")
        return v

    @field_validator("Competitors", mode="before")
    @classmethod
    def validate_competitors(cls, v):
        if not v:
            raise ValueError("競合製品の特長や価格は必須です")
        return v

    @field_validator("CustomerAttributes", mode="before")
    @classmethod
    def validate_customerAttributes(cls, v):
        if not v:
            raise ValueError("顧客属性は必須です")
        return v

    @field_validator("PurchasingBehavior", mode="before")
    @classmethod
    def validate_purchasingBehavior(cls, v):
        if not v:
            raise ValueError("購買行動や嗜好は必須です")
        return v


class NewMarketingStrategyPostRequest(BaseModel):
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

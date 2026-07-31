from typing import List

from pydantic import BaseModel, Field, field_validator


# 新規作成
class SalesForecastRequest(BaseModel):
    productName: str = Field(..., title="新製品名")
    productCategory: List[str] = Field(..., title="製品カテゴリ")
    features: str = Field(..., title="具体的な機能や特徴")
    useCase: str = Field(..., title="主な用途")
    analysisPriorities: List[str] = Field(..., title="分析重視ポイント")
    targetIndustry: List[str] = Field(..., title="対象業界")
    targetCustomers: List[str] = Field(..., title="対象顧客層")
    targetRegions: List[str] = Field(..., title="対象地域")
    marketData: str = Field(..., title="既に収集している市場データ")
    competingProducts: str = Field(..., title="主要競合製品と特徴")

    @field_validator("productName", mode="before")
    @classmethod
    def validate_productName(cls, v):
        if v is None:
            raise ValueError("productNameは必須です")
        return v

    @field_validator("productCategory", mode="before")
    @classmethod
    def validate_productCategory(cls, v):
        if v is None:
            raise ValueError("productCategoryは必須です")
        return v

    @field_validator("features", mode="before")
    @classmethod
    def validate_features(cls, v):
        if v is None:
            raise ValueError("featuresは必須です")
        return v

    @field_validator("useCase", mode="before")
    @classmethod
    def validate_useCase(cls, v):
        if v is None:
            raise ValueError("useCaseは必須です")
        return v

    @field_validator("analysisPriorities", mode="before")
    @classmethod
    def validate_analysisPriorities(cls, v):
        if v is None:
            raise ValueError("analysisPrioritiesは必須です")
        return v

    @field_validator("targetIndustry", mode="before")
    @classmethod
    def validate_targetIndustry(cls, v):
        if v is None:
            raise ValueError("targetIndustryは必須です")
        return v

    @field_validator("targetCustomers", mode="before")
    @classmethod
    def validate_targetCustomers(cls, v):
        if v is None:
            raise ValueError("targetCustomersは必須です")
        return v

    @field_validator("targetRegions", mode="before")
    @classmethod
    def validate_targetRegions(cls, v):
        if v is None:
            raise ValueError("targetRegionsは必須です")
        return v

    @field_validator("marketData", mode="before")
    @classmethod
    def validate_marketData(cls, v):
        if v is None:
            raise ValueError("marketDataは必須です")
        return v

    @field_validator("competingProducts", mode="before")
    @classmethod
    def validate_competingProducts(cls, v):
        if v is None:
            raise ValueError("competingProductsは必須です")
        return v


# 結果調整
class FixSalesForecastRequest(BaseModel):
    result: str = Field(..., title="作成結果")
    revisionPrompt: str = Field(..., title="結果調整プロンプト")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("revisionPrompt", mode="before")
    @classmethod
    def validate_revisionPrompt(cls, v):
        if v is None:
            raise ValueError("revisionPromptは必須です")
        return v

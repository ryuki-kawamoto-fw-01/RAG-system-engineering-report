from typing import Optional

from pydantic import BaseModel, Field, field_validator


class DefectAnalysisReportPostRequest(BaseModel):
    productName: str = Field(..., title="製品名")
    defectDescription: str = Field(..., title="不具合内容")
    occurenceCondition: str = Field(..., title="発生条件")
    usageEnvironment: str = Field(..., title="使用環境")
    impactScope: str = Field(..., title="影響範囲")
    defectData: str = Field(..., title="不具合データ")
    consideration: Optional[str] = Field(None, title="考慮事項")

    @field_validator("productName", mode="before")
    @classmethod
    def validate_productName(cls, v):
        if v is None:
            raise ValueError("製品名は必須です")
        return v

    @field_validator("defectDescription", mode="before")
    @classmethod
    def validate_defectDescription(cls, v):
        if v is None:
            raise ValueError("不具合内容は必須です")
        return v

    @field_validator("occurenceCondition", mode="before")
    @classmethod
    def validate_occurenceCondition(cls, v):
        if v is None:
            raise ValueError("発生条件は必須です")
        return v

    @field_validator("usageEnvironment", mode="before")
    @classmethod
    def validate_usageEnvironment(cls, v):
        if v is None:
            raise ValueError("使用環境は必須です")
        return v

    @field_validator("impactScope", mode="before")
    @classmethod
    def validate_impactScope(cls, v):
        if v is None:
            raise ValueError("影響範囲は必須です")
        return v

    @field_validator("defectData", mode="before")
    @classmethod
    def validate_defectData(cls, v):
        if v is None:
            raise ValueError("不具合データは必須です")
        return v


class DefectAnalysisReportFixRequest(BaseModel):
    result: str = Field(..., title="作成結果")
    modify: str = Field(..., title="修正事項")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("作成結果は必須です")
        return v

    @field_validator("modify", mode="before")
    @classmethod
    def validate_modify(cls, v):
        if v is None:
            raise ValueError("修正事項は必須です")
        return v

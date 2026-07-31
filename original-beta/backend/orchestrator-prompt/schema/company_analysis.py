from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

ALLOWED_METHODS = ["swot", "fiveforce", "pest", "fourp", "threec", "valueChain"]


class CompanyAnalysisPostRequest(BaseModel):
    business_name: Optional[str] = Field(..., title="事業名")
    analytical_methods: List[str] = Field(..., title="分析手法")
    company_name: str = Field(..., title="企業名")
    analysis_purpose: Optional[str] = Field(..., title="分析の目的や背景")
    analysis_considerations: Optional[str] = Field(..., title="考慮事項を追加する")

    @field_validator("analytical_methods", mode="before")
    @classmethod
    def validate_analytical_methods(cls, v):
        if len(v) <= 0:
            raise ValueError("分析手法は必須です")
        for method in v:
            if method not in ALLOWED_METHODS:
                raise ValueError("分析手法に不正データが存在します")
        return v

    @field_validator("company_name", mode="before")
    @classmethod
    def validate_company_name(cls, v):
        if v is None:
            raise ValueError("企業名は必須です")
        return v

    @model_validator(mode="before")
    @classmethod
    def validate_business_name(cls, v):
        if "fiveforce" in v["analytical_methods"] or "pest" in v["analytical_methods"]:
            if v["business_name"] is None:
                raise ValueError("事業名は必須です")
        return v


class CompanyReanalysisPostRequest(BaseModel):
    analytical_methods: List[str] = Field(..., title="分析手法")
    existing_analysis: str = Field(..., title="既存の分析")
    reanalysis_request: str = Field(..., title="追加で分析")

    @field_validator("analytical_methods", mode="before")
    @classmethod
    def validate_analytical_methods(cls, v):
        if len(v) <= 0:
            raise ValueError("分析手法は必須です")
        for method in v:
            if method not in ALLOWED_METHODS:
                raise ValueError("分析手法に不正データが存在します")
        return v

    @field_validator("existing_analysis", mode="before")
    @classmethod
    def validate_existing_analysis(cls, v):
        if v is None:
            raise ValueError("既存の分析結果は必須です")
        return v

    @field_validator("reanalysis_request", mode="before")
    @classmethod
    def validate_reanalysis_request(cls, v):
        if v is None:
            raise ValueError("追加で分析は必須です")
        return v
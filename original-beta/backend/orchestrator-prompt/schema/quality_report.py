from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class QualityReportPostRequest(BaseModel):
    company_name: str = Field(..., title="企業名")
    manufacturing_type: str = Field(..., title="製造業種類")

    # 現状の品質管理プロセス情報
    current_process_overview: Optional[str] = Field(
        None, title="現状の品質管理プロセス概要"
    )
    quality_data_management: Optional[str] = Field(None, title="品質データの管理方法")

    # 品質データ・履歴
    quality_history_data: Optional[str] = Field(None, title="過去の品質管理データ")
    quality_issues: Optional[List[str]] = Field(None, title="特定の品質問題")

    # 分析対象期間
    analysis_period: Optional[str] = Field(None, title="分析対象期間")

    # 改善目標・要求
    improvement_goals: Optional[str] = Field(None, title="改善目標")
    evaluation_metrics: Optional[List[str]] = Field(None, title="評価指標")

    # 追加考慮事項
    additional_considerations: Optional[str] = Field(None, title="追加考慮事項")
    report_detail_level: Optional[str] = Field("standard", title="レポート詳細レベル")

    @field_validator("company_name", mode="before")
    @classmethod
    def validate_company_name(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("企業名は必須です")
        return v

    @field_validator("manufacturing_type", mode="before")
    @classmethod
    def validate_manufacturing_type(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("製造業種類は必須です")
        return v

    @field_validator("report_detail_level", mode="before")
    @classmethod
    def validate_report_detail_level(cls, v):
        allowed_levels = ["standard", "detailed", "summary"]
        if v not in allowed_levels:
            raise ValueError(
                f"レポート詳細レベルは {allowed_levels} のいずれかである必要があります"
            )
        return v

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class QualityStandardDocumentRequest(BaseModel):
    # 必須項目
    product_name: str = Field(..., title="製品名")
    manufacturing_type: str = Field(..., title="製造業種")
    applicable_regulations: List[str] = Field(..., title="適用法規制")
    product_specifications: str = Field(..., title="製品仕様")
    tolerance_requirements: str = Field(..., title="許容範囲要求")
    document_detail_level: str = Field(..., title="文書詳細レベル")

    # 任意項目
    quality_characteristics: Optional[List[str]] = Field(None, title="品質特性")
    existing_inspection_methods: Optional[List[str]] = Field(None, title="既存検査方法")
    additional_considerations: Optional[str] = Field(None, title="追加考慮事項")

    @field_validator("product_name", mode="before")
    @classmethod
    def validate_product_name(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("製品名は必須です")
        return v

    @field_validator("manufacturing_type", mode="before")
    @classmethod
    def validate_manufacturing_type(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("製造業種は必須です")
        return v

    @field_validator("applicable_regulations", mode="before")
    @classmethod
    def validate_applicable_regulations(cls, v):
        if v is None or len(v) == 0:
            raise ValueError("適用法規制は必須です")
        return v

    @field_validator("product_specifications", mode="before")
    @classmethod
    def validate_product_specifications(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("製品仕様は必須です")
        return v

    @field_validator("tolerance_requirements", mode="before")
    @classmethod
    def validate_tolerance_requirements(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("許容範囲要求は必須です")
        return v

    @field_validator("document_detail_level", mode="before")
    @classmethod
    def validate_document_detail_level(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("文書詳細レベルは必須です")
        allowed_levels = ["standard", "detailed", "summary"]
        if v not in allowed_levels:
            raise ValueError(
                f"文書詳細レベルは {allowed_levels} のいずれかである必要があります"
            )
        return v

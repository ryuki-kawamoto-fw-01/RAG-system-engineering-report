from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

class TechassessPostRequest(BaseModel):
    field: str = Field(..., title="対象とする製造分野")
    region: str = Field(..., title="地域や市場")
    companySize: Optional[str] = Field("", title="企業規模")
    industryIssues: str = Field(..., title="現在の業界の課題や関心事")
    granularity: str = Field(..., title="分析の粒度")
    purpose: str = Field(..., title="使用目的")

    @field_validator("field", "region", "industryIssues", "granularity", "purpose", mode="before")
    @classmethod
    def validate_required_fields(cls, v, info):
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError(f"{info.field_name}は必須です")
        return v

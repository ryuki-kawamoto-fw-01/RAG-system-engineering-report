from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TechnologyTrendResearchPostRequest(BaseModel):
    technicalField: str = Field(..., title="主題")
    timeRange: str = Field(..., title="立場")
    targetArea: str = Field(..., title="アイデアの件数")
    reportFormat: Optional[str] = Field(..., title="考慮事項")

    @field_validator("technicalField", mode="before")
    @classmethod
    def validate_technical_field(cls, v):
        if v is None:
            raise ValueError("technical_fieldは必須です")
        return v

    @field_validator("timeRange", mode="before")
    @classmethod
    def validate_time_range(cls, v):
        if v is None:
            raise ValueError("time_rangeは必須です")
        return v

    @field_validator("targetArea", mode="before")
    @classmethod
    def validate_target_area(cls, v):
        if v is None:
            raise ValueError("target_areaは必須です")
        return v

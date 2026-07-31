from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SchedulePostRequest(BaseModel):

    newSchedulework: str = Field(..., title="スケジュール内容")
    newSchedulestartdate: date = Field(..., title="作業開始日")
    newScheduleenddate: date = Field(..., title="作業終了日")
    newScheduleConsiderations: Optional[str] = Field(..., title="考慮事項")

    @field_validator("newSchedulework", mode="before")
    @classmethod
    def validate_newSchedulework(cls, v):
        if v is None:
            raise ValueError("newScheduleworkは必須です")
        return v

    @field_validator("newSchedulestartdate", mode="before")
    @classmethod
    def validate_newSchedulestartdate(cls, v):
        if v is None:
            raise ValueError("newSchedulestartdateは必須です")
        return v

    @field_validator("newScheduleenddate", mode="before")
    @classmethod
    def validate_newScheduleenddate(cls, v):
        if v is None:
            raise ValueError("newScheduleenddateは必須です")
        return v

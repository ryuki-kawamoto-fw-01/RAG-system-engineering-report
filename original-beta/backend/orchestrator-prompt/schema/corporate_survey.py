from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class CorporateSurveyPostRequest(BaseModel):
    surveyCompany: str = Field(..., title="企業名")
    surveyContent: List[str] = Field(..., title="調査項目")
    surveyInformation: Optional[str] = Field(..., title="追加調査情報")

    @field_validator("surveyCompany", mode="before")
    @classmethod
    def validate_survey_company(cls, v):
        if v is None:
            raise ValueError("企業名は必須です")
        return v

    @field_validator("surveyContent", mode="before")
    @classmethod
    def validate_survey_content(cls, v):
        if len(v) <= 0:
            raise ValueError("調査項目は必須です")
        return v

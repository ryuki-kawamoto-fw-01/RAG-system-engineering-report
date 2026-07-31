from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ResearchReportPostRequest(BaseModel):
    subject: str = Field(..., title="研究テーマ")
    purpose: str = Field(..., title="研究目的")
    method: str = Field(..., title="研究方法")
    researchresult: str = Field(..., title="研究結果")
    references: str = Field(..., title="参考文献")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("subject", mode="before")
    @classmethod
    def validate_subject(cls, v):
        if v is None:
            raise ValueError("subjectは必須です")
        return v

    @field_validator("purpose", mode="before")
    @classmethod
    def validate_purpose(cls, v):
        if v is None:
            raise ValueError("purposeは必須です")
        return v

    @field_validator("method", mode="before")
    @classmethod
    def validate_method(cls, v):
        if v is None:
            raise ValueError("methodは必須です")
        return v

    @field_validator("researchresult", mode="before")
    @classmethod
    def validate_researchresult(cls, v):
        if v is None:
            raise ValueError("researchresultは必須です")
        return v

    @field_validator("references", mode="before")
    @classmethod
    def validate_references(cls, v):
        if v is None:
            raise ValueError("referencesは必須です")
        return v


class ResearchNewReportPostRequest(BaseModel):
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

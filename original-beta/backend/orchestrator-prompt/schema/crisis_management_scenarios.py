from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CrisisManagementScenariosServicePostRequest(BaseModel):
    industry: str = Field(title="業界・業種")
    businessSize: str = Field(title="企業規模・拠点情報")
    businessContent: str = Field(title="シナリオを作成する業務内容")
    selectedOptions: list[str] = Field(title="リスクカテゴリ")
    additionalContents: str = Field(title="リスク内容")
    considerations: Optional[str] = Field(None, title="考慮事項")

    @field_validator("industry", mode="before")
    @classmethod
    def validate_industry(cls, v):
        if not v:
            raise ValueError("業界・業種は必須です")
        return v

    @field_validator("businessSize", mode="before")
    @classmethod
    def validate_businessSize(cls, v):
        if not v:
            raise ValueError("企業規模・拠点情報は必須です")
        return v

    @field_validator("businessContent", mode="before")
    @classmethod
    def validate_businessContent(cls, v):
        if not v:
            raise ValueError("シナリオを作成する業務内容は必須です")
        return v

    @field_validator("selectedOptions", mode="before")
    @classmethod
    def validate_selectedOptions(cls, v):
        if not v:
            raise ValueError("リスクカテゴリは必須です")
        return v


class NewCrisisManagementScenariosServicePostRequest(BaseModel):
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
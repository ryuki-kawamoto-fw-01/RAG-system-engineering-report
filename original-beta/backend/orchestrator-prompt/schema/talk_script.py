from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="MIMEタイプ")
    size: int = Field(..., title="ファイルサイズ")


class CreateTalkScriptPostRequest(BaseModel):
    fileList: List[FileReference] = Field(..., title="ファイルリスト")
    purpose: str = Field(..., title="提案書目的")
    partnerCharacteristics: str = Field(..., title="提案相手の特徴")
    considerations: Optional[str] = Field(..., title="提案の考慮事項")

    @field_validator("purpose", mode="before")
    @classmethod
    def validate_purpose(cls, v):
        if v is None:
            raise ValueError("提案書目的は必須です")
        return v

    @field_validator("partnerCharacteristics", mode="before")
    @classmethod
    def validate_partnerCharacteristics(cls, v):
        if v is None:
            raise ValueError("提案相手の特徴は必須です")
        return v


class FixTalkScriptPostRequest(BaseModel):
    result: str = Field(..., title="作成結果")
    modify: str = Field(..., title="修正事項")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("作成結果目的は必須です")
        return v

    @field_validator("modify", mode="before")
    @classmethod
    def validate_modify(cls, v):
        if v is None:
            raise ValueError("修正事項は必須です")
        return v

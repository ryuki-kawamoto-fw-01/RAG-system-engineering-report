from typing import Optional, List

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    """ファイル参照情報"""

    name: str = Field(..., description="ファイル名")
    type: str = Field(..., description="ファイルのMIMEタイプ")
    size: int = Field(..., description="ファイルサイズ(bytes)")


class CreateNewMailPostRequest(BaseModel):
    newMailTo: str = Field(..., title="宛先")
    newMailFrom: str = Field(..., title="差出人")
    newMailPurpose: str = Field(..., title="目的")
    newMailContent: str = Field(..., title="内容")
    newMailConsiderations: Optional[str] = Field(..., title="考慮事項")

    @field_validator("newMailTo", mode="before")
    @classmethod
    def validate_newMailTo(cls, v):
        if v is None:
            raise ValueError("宛先は必須です")
        return v

    @field_validator("newMailFrom", mode="before")
    @classmethod
    def validate_newMailFrom(cls, v):
        if v is None:
            raise ValueError("差出人は必須です")
        return v

    @field_validator("newMailPurpose", mode="before")
    @classmethod
    def validate_newMailPurpose(cls, v):
        if v is None:
            raise ValueError("目的は必須です")
        return v

    @field_validator("newMailContent", mode="before")
    @classmethod
    def validate_newMailContent(cls, v):
        if v is None:
            raise ValueError("内容は必須です")
        return v


class CreateReplyMailPostRequest(BaseModel):
    replyMailTo: str = Field(..., title="宛先")
    replyMailFrom: str = Field(..., title="差出人")
    replyMailPurpose: str = Field(..., title="目的")
    replyMailContent: str = Field(..., title="内容")
    receivedMailText: Optional[str] = Field(None, title="msg")
    replyMailConsiderations: Optional[str] = Field(None, title="考慮事項")

    @field_validator("replyMailTo", mode="before")
    @classmethod
    def validate_replyMailTo(cls, v):
        if v is None:
            raise ValueError("宛先は必須です")
        return v

    @field_validator("replyMailFrom", mode="before")
    @classmethod
    def validate_replyMailFrom(cls, v):
        if v is None:
            raise ValueError("差出人は必須です")
        return v

    @field_validator("replyMailPurpose", mode="before")
    @classmethod
    def validate_replyMailPurpose(cls, v):
        if v is None:
            raise ValueError("目的は必須です")
        return v

    @field_validator("replyMailContent", mode="before")
    @classmethod
    def validate_replyMailContent(cls, v):
        if v is None:
            raise ValueError("内容は必須です")
        return v


class FixNewMailPostRequest(BaseModel):
    createdSubject: str = Field(..., title="件名")
    createdContent: str = Field(..., title="本文")
    modify: str = Field(..., title="修正事項")

    @field_validator("createdSubject", mode="before")
    @classmethod
    def validate_createdSubject(cls, v):
        if v is None:
            raise ValueError("件名は必須です")
        return v

    @field_validator("createdContent", mode="before")
    @classmethod
    def validate_createdContent(cls, v):
        if v is None:
            raise ValueError("本文は必須です")
        return v

    @field_validator("modify", mode="before")
    @classmethod
    def validate_modify(cls, v):
        if v is None:
            raise ValueError("修正事項は必須です")
        return v


class FixReplyMailPostRequest(BaseModel):
    createdContent: str = Field(..., title="本文")
    modify: str = Field(..., title="修正事項")

    @field_validator("createdContent", mode="before")
    @classmethod
    def validate_createdContent(cls, v):
        if v is None:
            raise ValueError("本文は必須です")
        return v

    @field_validator("modify", mode="before")
    @classmethod
    def validate_modify(cls, v):
        if v is None:
            raise ValueError("修正事項は必須です")
        return v

from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ProductNamePostRequest(BaseModel):
    productnameSubject: str = Field(..., title="製品の概要")
    productnameRole: str = Field(..., title="製品の特長やポイント")
    productnameConvention: Optional[str] = Field(..., title="命名規則")

    @field_validator("productnameSubject", mode="before")
    @classmethod
    def validate_productname_subject(cls, v):
        if v is None:
            raise ValueError("productname_subjectは必須です")
        return v

    @field_validator("productnameRole", mode="before")
    @classmethod
    def validate_productname_role(cls, v):
        if v is None:
            raise ValueError("productname_roleは必須です")
        return v

    @field_validator("productnameConvention", mode="before")
    @classmethod
    def validate_productname_convention(cls, v):
        if v is None:
            raise ValueError("productname_conventionは必須です")
        return v


class ProductNameNewPostRequest(BaseModel):
    result: str = Field(..., title="既存のネーミング案")
    newproductnameRequest: str = Field(..., title="追加のネーミング指示")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("newproductnameRequest", mode="before")
    @classmethod
    def validate_newproductnameRequest(cls, v):
        if v is None:
            raise ValueError("newproductnameRequestは必須です")
        return v

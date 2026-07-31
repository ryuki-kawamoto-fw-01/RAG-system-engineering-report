from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ProductAarrrPostRequest(BaseModel):
    product_service: str = Field(..., title="商品・サービス")
    product_service_content: str = Field(..., title="商品・サービスの内容")
    additionalConsiderations: Optional[str] = Field(..., title="考慮事項")

    @field_validator("product_service", mode="before")
    @classmethod
    def validate_product_service(cls, v):
        if v is None:
            raise ValueError("商品・サービスは必須です")
        return v

    @field_validator("product_service_content", mode="before")
    @classmethod
    def validate_product_service_content(cls, v):
        if v is None:
            raise ValueError("商品・サービスの内容は必須です")
        return v

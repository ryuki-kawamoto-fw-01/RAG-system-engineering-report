from typing import Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class ProductIdeaPostRequest(BaseModel):
    text: Optional[str] = Field(title="新商品アイデア作成の指示")
    ideaDirection: str = Field(..., title="新商品アイデアの方向性")
    additionalConsiderations: Optional[str] = Field(title="新商品アイデアの考慮事項")
    userChat: Optional[str] = Field(title="チャットの内容")
    chatHistory: Optional[list[dict]] = Field(title="チャットの履歴")

    @field_validator("ideaDirection", mode="before")
    @classmethod
    def validate_idea_direction(cls, v):
        if v is None:
            raise ValueError("方向性は必須です")
        return v


class ProductIdeaUpdateRequest(BaseModel):
    productIdea: str = Field(..., title="商品アイデア")
    userChat: Optional[str] = Field(title="ユーザのチャット入力")
    chatHistory: Optional[list[dict]] = Field(title="チャットの履歴")

    @field_validator("productIdea", mode="before")
    @classmethod
    def validate_product_idea(cls, v):
        if v is None:
            raise ValueError("product_ideaは必須です")
        return v

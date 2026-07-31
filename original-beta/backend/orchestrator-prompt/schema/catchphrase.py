from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class CatchphrasePostRequest(BaseModel):
    productName: str = Field(..., title="製品名")
    productInformation: str = Field(..., title="製品情報")
    targetCustomer: str = Field(..., title="ターゲット顧客")
    Competitor: str = Field(..., title="競合との比較")
    Consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("productName", mode="before")
    @classmethod
    def validate_product_name(cls, v):
        if v is None:
            raise ValueError("productNameは必須です")
        return v

    @field_validator("productInformation", mode="before")
    @classmethod
    def validate_product_information(cls, v):
        if v is None:
            raise ValueError("productInformationは必須です")
        return v

    @field_validator("targetCustomer", mode="before")
    @classmethod
    def validate_target_customer(cls, v):
        if v is None:
            raise ValueError("targetCustomerは必須です")
        return v

    @field_validator("Competitor", mode="before")
    @classmethod
    def validate_competitor(cls, v):
        if v is None:
            raise ValueError("Competitorは必須です")
        return v


class CatchphraseFileRequest(BaseModel):
    # ファイル参照リスト
    fileList: List[FileReference] = Field(..., title="ファイルリスト")
    Consideration: Optional[str] = Field(default="", title="考慮事項")

    @field_validator("fileList", mode="before")
    @classmethod
    def validate_file_list(cls, v):
        if not v or len(v) == 0:
            raise ValueError("ファイルは必須です")
        return v

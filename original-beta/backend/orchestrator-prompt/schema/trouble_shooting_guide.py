from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    """Blob Storage上のファイル参照"""

    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class TroubleShootingGuidePostRequest(BaseModel):
    productName: str = Field(..., title="製品・システム名")
    productPurpose: str = Field(..., title="製品の目的")
    productSpecificationText: Optional[str] = Field(None, title="製品仕様(テキスト)")
    productSpecificationFiles: Optional[List[FileReference]] = Field(
        None, title="製品仕様(ファイル)"
    )

    @field_validator("productName", mode="before")
    @classmethod
    def validate_productName(cls, v):
        if v is None:
            raise ValueError("製品・システム名は必須です")
        return v

    @field_validator("productPurpose", mode="before")
    @classmethod
    def validate_productPurpose(cls, v):
        if v is None:
            raise ValueError("製品の目的は必須です")
        return v

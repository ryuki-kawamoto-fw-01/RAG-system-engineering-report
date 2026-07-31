from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class TextCheckPostRequest(BaseModel):
    checkContent1: str = Field(..., title="確認内容1")
    textInput: Optional[str] = Field("", title="チェックしたい文章")
    checkContent2: Optional[str] = Field("", title="確認内容2")
    checkContent3: Optional[str] = Field("", title="確認内容3")
    fileList: Optional[List[FileReference]] = Field(None, title="ファイルリスト")

    @field_validator("checkContent1", mode="before")
    @classmethod
    def validate_check_content1(cls, v):
        if v is None:
            raise ValueError("checkContent1は必須です")
        return v

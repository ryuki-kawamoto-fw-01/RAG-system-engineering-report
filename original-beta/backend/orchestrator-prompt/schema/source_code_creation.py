from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class FileReference(BaseModel):
    """Blob Storage上のファイル参照"""

    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class CreateSourceCodePostRequest(BaseModel):
    languageSelect: str = Field(..., title="プログラミング言語")
    inputMessage: str = Field(..., title="要件")
    pastQA: Optional[str] = Field(None, title="過去QA")
    fileList: Optional[List[FileReference]] = Field(None, title="参照ファイルリスト")

    @field_validator("languageSelect", mode="before")
    @classmethod
    def validate_language(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("プログラミング言語は必須です")
        return v

    @field_validator("inputMessage", mode="before")
    @classmethod
    def validate_requirements(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("要件は必須です")
        return v

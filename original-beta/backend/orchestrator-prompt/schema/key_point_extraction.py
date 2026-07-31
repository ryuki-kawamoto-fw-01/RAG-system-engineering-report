from typing import List, Optional

from pydantic import BaseModel, Field


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class KeyPointExtractionPostRequest(BaseModel):
    fileList: Optional[List[FileReference]] = Field(None, title="ファイルリスト")
    text: Optional[str] = Field(None, title="文章")
    additionalConsiderations: Optional[str] = Field(None, title="考慮事項")

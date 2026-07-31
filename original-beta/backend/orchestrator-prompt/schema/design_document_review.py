from typing import Optional

from pydantic import BaseModel, Field


class FileReference(BaseModel):
    name: str = Field(..., title="ファイルパス")
    type: str = Field(..., title="ファイルタイプ")
    size: int = Field(..., title="ファイルサイズ")


class DesignDocumentReviewPostRequest(BaseModel):
    reviewPurpose: Optional[str] = Field(None, title="レビューの目的")
    priorityPoint: Optional[str] = Field(None, title="特に見てほしい箇所")
    consideration: Optional[str] = Field(None, title="考慮事項")

from typing import List
from pydantic import BaseModel, Field


class Citation(BaseModel):
    search_title: str = Field(..., description="引用ドキュメントのタイトル")
    search_path: str = Field(..., description="引用ドキュメントのファイルパス")
    split_file_path: str = Field(default="", description="分割ファイルのパス")


class AISearchSegment(BaseModel):
    text: str = Field(..., description="引用を元に生成したテキスト")
    citation: List[Citation] = Field(..., description="引用ドキュメントのリスト")


class AISearchResponse(BaseModel):
    segments: List[AISearchSegment]
    type: str = "segments"

class AIChatResponse(BaseModel):
    answer: str = Field(..., description="LLMの応答")
    type: str = "chat"


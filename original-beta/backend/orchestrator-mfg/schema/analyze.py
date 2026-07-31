import base64
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class Message(BaseModel):
    role: str = Field(..., title="役割")
    content: str = Field(..., title="指示内容")
    file_name: Optional[str] = Field(None, title="ファイル名")
    file_content: Optional[str] = Field(None, title="添付ファイル")

    @field_validator("file_content", mode="before")
    @classmethod
    def validate_file_content(cls, v):
        if v is not None:
            try:
                base64.b64decode(v)
            except Exception:
                raise ValueError("'file_content' is not valid base64 encoded data")
        return v


class AnalyzePostRequest(BaseModel):
    messages: List[Message] = Field(..., title="指示内容一覧")

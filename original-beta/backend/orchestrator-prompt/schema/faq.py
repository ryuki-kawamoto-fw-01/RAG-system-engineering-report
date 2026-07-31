from typing import List

from pydantic import BaseModel


# 入力バリデーション用のスキーマ（FormDataとJSONの両方に対応）
class FaqRequestSchema(BaseModel):
    documentType: str
    checkpoints: List[str]
    additionalConsiderations: str | None = None
    text: str | None = None

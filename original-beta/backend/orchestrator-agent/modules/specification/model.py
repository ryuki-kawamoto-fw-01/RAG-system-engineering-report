from typing import List
from pydantic import BaseModel, Field


# 各ファイル情報の構造を定義
class TableSearchResponse(BaseModel):
    id: str = Field(..., description="ファイルID")
    document_number: str = Field(..., description="ドキュメント番号")
    category_code: str = Field(..., description="分類コード")
    category_name: str = Field(..., description="分類名")
    subcategory_code: str = Field(..., description="サブ分類コード")
    subcategory_name: str = Field(..., description="サブ分類名")
    description: str = Field(..., description="説明")


class TableSearchCombinedResponse(BaseModel):
    results: List[TableSearchResponse] = Field(..., description="関連ファイルの一覧")

from typing import List

from pydantic import BaseModel, Field


# bing search function calling
class WebSearchParameters(BaseModel):
    query: str = Field(
        ...,
        description="ユーザーの質問",
        examples=["AIの最新動向は？", "Pythonの学習方法を教えてください。"],
    )


# 検索結果のランク付け
class RankedResult(BaseModel):
    title: str  # = Field(..., description="選択された検索結果のタイトル")
    url: str  # = Field(..., description="選択された検索結果のURL")
    snippet: str  # = Field(..., description="選択された検索結果の抜粋")
    reason: str  # = Field(..., description="この結果を選んだ理由の簡潔な説明")
    score: int  # = Field(..., ge=1, le=5, description="検索結果のスコア（1-5）")
    rank: int  # = Field(..., description="検索結果のランク（1-3）")


# 検索結果の再ランク付けのレスポンス
class RerankResponse(BaseModel):
    summary: str  # = Field(..., description="選択された結果の全体的な関連性と有用性についての簡潔な要約")
    rankedResults: List[
        RankedResult
    ]  # = Field(..., max_items=3, description="ランク付けされた上位3つの検索結果") #type: ignore

    def format_search_result(self):
        if len(self.rankedResults) > 0:
            return [
                {
                    "id": idx + 1,
                    "title": rankResult.title,
                    "url": rankResult.url,
                    "snippet": rankResult.snippet,
                }
                for idx, (rankResult) in enumerate(self.rankedResults)
            ]
        else:
            raise ValueError("rankedResults is empty")


class KeywordVariation(BaseModel):
    id: int  # = Field(..., description="キーワードの一意の識別子")
    keyword: str  # = Field(..., description="生成された検索キーワード")


class KeywordVariationResponse(BaseModel):
    # keywords: list[KeywordVariation] #= Field(..., min_items=3, max_items=5, description="生成された検索キーワードのリスト") #type: ignore
    keywords: list[KeywordVariation]


# Function callingで使用する関数の定義
## variy kewords
VARIY_KEYWORDS_FUNCTION = {
    "name": "variy_keywords",
    "description": "与えられた検索クエリに基づいて、検索キーワードを生成します。",
    "parameters": KeywordVariationResponse.model_json_schema(),
}

## rerank search results
RERANK_FUNCTION = {
    "name": "rerank_search_results",
    "description": "与えられた検索クエリと検索結果に基づいて、検索結果を再ランク付けします。",
    "parameters": RerankResponse.model_json_schema(),
}

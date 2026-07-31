import operator
from typing import Annotated

from pydantic import BaseModel, Field


class OptimizedGoal(BaseModel):
    description: str = Field(..., description="目標の説明")
    metrics: str = Field(..., description="目標の達成度を測定する方法")

    @property
    def text(self) -> str:
        return f"{self.description}(目標の測定基準: {self.metrics})"


class WholeResearchPlan(BaseModel):
    description: str = Field(..., description="全体的なリサーチプランの説明")

    @property
    def text(self) -> str:
        return f"{self.description}"


class SearchQuery(BaseModel):
    query: str = Field(..., description="検索クエリ")

    @property
    def text(self) -> str:
        return f"{self.query}"


class SearchQueries(BaseModel):
    queries: list[SearchQuery] = Field(
        default_factory=list,
        # min_items=1,  # openai.BadRequestError: Error code: 400, 'minItems' is not permitted
        # max_items=5,
        description="検索クエリのリスト",
    )


class DecomposedSection(BaseModel):
    section_index: int = Field(..., description="セクション番号 (0始まり)")
    section_name: str = Field(..., description="セクション名")
    description: str = Field(..., description="セクションの説明")
    section_research_plan: str = Field(..., description="セクションのリサーチプラン")


class DecomposedSections(BaseModel):
    sections: list[DecomposedSection] = Field(
        default_factory=list,
        # min_items=2,
        # max_items=5,
        description="2~5個に分解されたセクション",
    )


class Source(BaseModel):
    title: str = Field(..., description="引用タイトル")
    url: str = Field(..., description="引用URL")


class BingGroundingResult(BaseModel):
    query: str = Field(..., description="検索クエリ")
    response_messages: list[str] = Field(..., description="応答メッセージ")
    sources: list[Source] = Field(..., description="引用")


class SearchResult(BaseModel):
    section_index: int = Field(..., description="セクション番号")
    query: str = Field(..., description="検索クエリ")
    result: str = Field(..., description="検索結果+[title](url)")
    sources: list[Source] = Field(..., description="引用")


class ReflectionJudgment(BaseModel):
    reflection: str = Field(
        description="このタスクに取り組んだ際のあなたの思考プロセスを振り返ってください。何か改善できる点はありましたか? 次に同様のタスクに取り組む際に、より良い結果を出すための教訓を2〜3文程度で簡潔に述べてください。"
    )
    needs_retry: bool = Field(
        description="リトライが必要かどうかの判定。タスクの実行結果は適切だったと思いますか?あなたの判断を真偽値で示してください。"
    )
    confidence: float = Field(
        description="あなたの判断に対するあなたの自信の度合いを0から1までの小数で示してください。"
    )
    reasons: list[str] = Field(
        description="タスクの実行結果の適切性とそれに対する自信度について、判断に至った理由を簡潔に列挙してください。"
    )


class Reflection(BaseModel):
    id: str = Field(description="リフレクション内容に一意性を与えるためのID")
    section: DecomposedSection = Field(description="ユーザーから与えられたタスクの内容")
    reflection: ReflectionJudgment = Field(description="リフレクション")


class SectionContent(BaseModel):
    section_content: str = Field(..., description="セクションの内容")
    sources: list[Source] = Field(..., description="引用")


class DeepResearchAgentState(BaseModel):
    query: str = Field(..., description="ユーザーが最初に入力したクエリ")
    goal: str = Field(default="", description="全体的な目標")
    whole_research_plan: str = Field(default="", description="全体的なリサーチプラン")
    sections: list[DecomposedSection] = Field(
        default_factory=list, description="各セクションのリスト"
    )
    current_section_index: int = Field(
        default=0, description="現在リサーチ中のセクションの番号"
    )
    # TODO: section_index ごとにまとめたい。現在は1回に生成された検索クエリたちごと
    research_results: Annotated[list[list[SearchResult]], operator.add] = Field(
        default_factory=list, description="実行済みリサーチの結果リスト"
    )
    reflection_ids: Annotated[list[str], operator.add] = Field(
        default_factory=list, description="リフレクション結果のIDリスト"
    )
    section_contents: Annotated[list[SectionContent], operator.add] = Field(
        default_factory=list, description="各セクションの内容"
    )
    final_output: str = Field(default="", description="最終的な出力結果")
    retry_count: int = Field(default=0, description="タスクの再試行回数")
    sources: list[Source] = Field(
        default_factory=list, description="最終的な出力結果に関連する引用リスト"
    )

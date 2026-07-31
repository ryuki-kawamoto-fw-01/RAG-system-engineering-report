from pydantic import BaseModel, Field


class UserIntention(BaseModel):
    abstract_intention: list[str] = Field(
        ..., description="ユーザーが求める情報の全体的な目的を記述する"
    )
    specific_subgoals: list[str] = Field(
        ..., description="ユーザーが求める情報のサブ目的を記述する"
    )

    class Config:
        schema_extra = {
            "example": {
                "abstract_intention": ["プロジェクトの進捗状況を把握する"],
                "specific_subgoals": [
                    "最新の開発フェーズを知る",
                    "チームの構成を確認する",
                ],
            }
        }


class ContextualizedOutput(BaseModel):
    user_intention: UserIntention = Field(..., description="ユーザーの意図に関する情報")
    reformulated_query: str = Field(
        ..., description="改良されたクエリの特徴をリストアップする"
    )

    class Config:
        schema_extra = {
            "example": {
                "user_intention": {
                    "abstract_intention": ["プロジェクトの進捗状況を把握する"],
                    "specific_subgoals": [
                        "最新の開発フェーズを知る",
                        "チームの構成を確認する",
                    ],
                },
                "reformulated_query": "プロジェクトの進捗状況を教えてください。特に、最新の開発フェーズとチームの構成について知りたいです。",
            }
        }


if __name__ == "__main__":
    print(ContextualizedOutput.model_json_schema())

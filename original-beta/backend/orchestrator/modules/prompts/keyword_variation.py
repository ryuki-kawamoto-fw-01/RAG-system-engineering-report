from typing import Dict, List

from modules.utils import get_current_date_time
from openai.types.chat import ChatCompletionMessageToolCall

# 3. 生成したキーワードが以下の条件を満たしているか確認してください：
# - 日本語と英語の両方を適切に使用している - removed
# Condition
# - 日本語と英語の両方を使用することで、より幅広い検索結果を得られる可能性があります。 - removed

# Notes
# - 日本語と英語の両方を使用することで、より幅広い検索結果を得られる可能性があります。 - removed


def create_search_keyword_variation_prompt(
    question: str,
    chat_history: List[Dict[str, str | List[ChatCompletionMessageToolCall]]],
    context_info: str,
    hold_keywords: bool = True,
) -> str:
    """
    ユーザーの検索クエリと会話履歴から、Web検索に適した複数の検索キーワードを生成するためのプロンプトを作成する関数

    Args:
        user_query (str): ユーザーの検索クエリ
        conversation_history (str): 会話履歴
        hold_keywords (bool): ユーザーの検索クエリを必ず含めるかどうか

    Returns:
        str: 生成されたプロンプト
    """
    conversation_history_str = "\n".join(
        [f"{message['role']}: {message['content']}" for message in chat_history]
    )

    # ユーザーの検索クエリを必ず含めるかどうか
    if hold_keywords:
        keyword_condition = "- ユーザーの検索クエリを必ず含めてください。\n- ユーザーの意図を正確に反映しつつ、異なる角度からのキーワードを生成することで、より包括的な検索結果を得られます。"
    else:
        keyword_condition = "- ユーザーの意図を正確に反映しつつ、異なる角度からのキーワードを生成することで、より包括的な検索結果を得られます。"
    return f"""
ユーザーの検索クエリと会話履歴から、Web検索に適した複数の検索キーワードを生成してください。
Knowledge cutoff: 2023-10
Current date: {get_current_date_time()}

**注意**
- 現在の日時は{get_current_date_time()}です。あなたはこの日時を頭に入れてください。

# 入力データ
以下の情報を分析し、ユーザーの真の意図や興味を推測してください：
1. ユーザーの検索クエリ: {question}
2. 会話の履歴: {conversation_history_str}
3. 現在の日時: {get_current_date_time()}
4. コンテキスト情報: {context_info}

**コンテキスト情報**: コンテキスト情報は、ユーザーの質問や対話履歴に基づいて取得された関連する情報を示します。

# Steps

1. ユーザーの検索クエリと会話履歴を慎重に分析し、ユーザーの真の意図や興味を推測してください。
2. 推測した意図に基づいて、3〜5個の異なる検索キーワードまたはフレーズを生成してください。
3. 生成したキーワードが以下の条件を満たしているか確認してください：
   - 具体的で明確である
   - 可能な限り短く、簡潔である
   - 異なる視点や側面をカバーしている
4. 生成したキーワードを指定された出力形式でリストアップしてください。

# Conditions

- キーワードは検索エンジンで使用されることを念頭に置いて生成してください。
{keyword_condition}
- 生成されたキーワードに説明や追加のコメントは不要です。JSONフォーマットのみを出力してください。

# Output Format

JSONフォーマットで出力してください。以下の構造を使用してください：

{{
  "keywords": [
    {{"id": 1, "keyword": "検索キーワード1"}},
    {{"id": 2, "keyword": "検索キーワード2"}},
    {{"id": 3, "keyword": "検索キーワード3"}},
    {{"id": 4, "keyword": "検索キーワード4"}},
    {{"id": 5, "keyword": "検索キーワード5"}}
  ]
}}

注意: 必ず3つ以上のキーワードを生成し、最大5つまでとしてください。

# Notes

- キーワードは検索エンジンで使用されることを念頭に置いて生成してください。
- ユーザーの意図を正確に反映しつつ、異なる角度からのキーワードを生成することで、より包括的な検索結果を得られます。
- 生成されたキーワードに説明や追加のコメントは不要です。JSONフォーマットのみを出力してください。
"""

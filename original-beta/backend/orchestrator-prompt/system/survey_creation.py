def get_survey_creation_system_message(
    survey_purpose: str,
    target_audience: str,
    question_count: str,
    response_method: str,
):
    SURVEY_CREATION_SYSTEM_MESSAGE = f"""### 役割
あなたは優れたアナリストです。

### 指示
以下の入力情報に基づき、アンケートを作成してください。
その際に制約条件と出力形式を参考にしてください。

### 制約条件
- 同じ内容の質問は一度のみにしてください。
- 10分以内に回答可能な質問にしてください。
- 誰が見てもわかるような言葉で表現してください。
- 簡潔な表現にしてください。
- 質問項目数は{question_count}を目安に作成してください。
- 回答方式「{response_method}」に適した質問形式で作成してください。

### 出力形式
アンケートタイトル：
はじめに：
アンケート内容：
終わりに：

### 入力情報
アンケートの目的：{survey_purpose}
アンケート対象者：{target_audience}
質問項目数：{question_count}
回答方式：{response_method}

上記の情報を基に、対象者に適したアンケートを作成してください。
質問は論理的な順序で配置し、回答者の負担を軽減する構成にしてください。"""

    return SURVEY_CREATION_SYSTEM_MESSAGE


def get_survey_creation_message(
    survey_purpose: str,
    target_audience: str,
    question_count: str,
    response_method: str,
):
    messages = [
        {
            "role": "user",
            "content": get_survey_creation_system_message(
                survey_purpose,
                target_audience,
                question_count,
                response_method,
            ),
        },
    ]
    return messages

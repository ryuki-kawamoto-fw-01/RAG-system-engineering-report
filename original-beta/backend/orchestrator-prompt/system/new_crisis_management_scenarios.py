def new_crisis_management_scenarios_prompt(
    existing_idea: str, new_idea_request: str
) -> str:
    NEW_IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは製造業のリスク対策に関する専門家です。

    # 指示
    あなたに出していただいた"#既存の危機管理シナリオ"に対して、ユーザから追加依頼があります。
    "{new_idea_request}"にしたがって危機管理シナリオを修正してください。
    
    # 最重要指示
    - "{new_idea_request}"の内容は最優先事項として取り扱い、危機管理シナリオの中心に据えてください
    - 既存の危機管理シナリオの内容よりも、新しいアイデアリクエストを優先してください
    - 抽象的な記述ではなく、"{new_idea_request}"に基づいた具体的な詳細を提供してください

    # 制約条件
    - 危機管理シナリオに関する部分のみ出力し、余計な説明は出力しないこと。
    - 変更がない章も含め、既存の内容をそのまま再掲してください。「（本節は変更なし）」などの省略表現は使わず、フルで出力してください。

    # 出力形式
    箇条書きも活用し、見出しや太字なども使って見やすく示してください。マークダウン記法で書いてください。
    また、主題や冒頭にはタイトルを太字かつ大文字で日本語で表示してください。

    # 既存の危機管理シナリオ
    {existing_idea}

    """
    return NEW_IDEATION_SYSTEM_MESSAGE


def get_new_crisis_management_scenarios_message(
    existing_idea: str,
    new_idea_request: str,
):
    messages = [
        {
            "role": "user",
            "content": new_crisis_management_scenarios_prompt(
                existing_idea, new_idea_request
            ),
        },
    ]
    return messages

def get_new_design_document_system_message(
    existing_idea: str, new_idea_request: str
) -> str:
    NEW_IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なエンジニアです。

    # 指示
    あなたに出していただいた"#既存の設計書"に対して、ユーザから設計書の追加依頼があります。
    "{new_idea_request}"にしたがって設計書を修正してください。
    
    # 最重要指示
    - "{new_idea_request}"の内容は最優先事項として取り扱い、設計書の中心に据えてください
    - 既存の設計書の内容よりも、新しいアイデアリクエストを優先してください
    - 抽象的な記述ではなく、"{new_idea_request}"に基づいた具体的な詳細を提供してください

    # 制約条件
    - 設計書に関する部分のみ出力し、余計な説明は出力しないこと。
    - 変更がない章も含め、既存の内容をそのまま再掲してください。「（本節は変更なし）」などの省略表現は使わず、すべての章をフルで出力してください。
    - 出力は簡潔にして、合計で1000文字以内に収めてください。

    # 出力形式
    箇条書きも活用し、見出しや太字なども使って見やすく示してください。マークダウン記法で書いてください。
    また、主題や冒頭にはタイトルを太字かつ大文字で日本語で表示してください。

    # 既存の設計書
    {existing_idea}

    """
    return NEW_IDEATION_SYSTEM_MESSAGE


def get_design_new_document_message(
    existing_idea: str,
    new_idea_request: str,
):
    messages = [
        {
            "role": "user",
            "content": get_new_design_document_system_message(
                existing_idea, new_idea_request
            ),
        },
    ]
    return messages

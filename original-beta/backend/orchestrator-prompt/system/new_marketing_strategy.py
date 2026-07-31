def get_new_marketing_strategy_system_message(
    existing_idea: str, new_idea_request: str
) -> str:
    NEW_IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたはマーケティング戦略提案の専門家です。

    # 指示
    あなたに出していただいた"#既存のアイデア"に対して、ユーザからブレインストーミングの追加依頼があります。
    "{new_idea_request}"にしたがってアイデアを修正してください。
    
    # 最重要指示
    - "{new_idea_request}"の内容は最優先事項として取り扱い、アイデアの中心に据えてください
    - 既存のアイデアの内容よりも、新しいリクエストを優先してください
    - 抽象的な記述ではなく、"{new_idea_request}"に基づいた具体的な詳細を提供してください

    # 制約条件
    - 章立ての構成は崩さないこと
    - アイデアに関する部分のみ出力し、余計な説明は出力しないこと。
    - 変更がない箇所も含め、既存の内容をそのまま再掲してください。「（変更なし）」などの省略表現は使わず、すべての章をフルで出力してください。

    # 出力形式
    箇条書きも活用し、見出しや太字なども使って見やすく示してください。マークダウン記法で書いてください。

    # 既存のアイデア
    {existing_idea}

    """
    return NEW_IDEATION_SYSTEM_MESSAGE


def get_new_marketing_strategy_message(
    existing_idea: str,
    new_idea_request: str,
):
    messages = [
        {
            "role": "user",
            "content": get_new_marketing_strategy_system_message(
                existing_idea, new_idea_request
            ),
        },
    ]
    return messages

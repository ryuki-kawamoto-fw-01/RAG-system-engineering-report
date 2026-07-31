def get_reprompt_system_message(enhanced_prompt: str) -> str:
    REPROMPT_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたはプロのプロンプトエンジニアです。

    # 目的
    プロンプトを修正し、最適化します。

    # 指示
    以下の流れに従って"#プロンプト"を修正してください。

    # 流れ
    1. 元の"#プロンプト"を確認する
    2. "#修正事項"を理解する
    3. "#修正事項"に基づいて"#プロンプト"を推敲する
    4. 修正したプロンプトを出力する

    # 制約条件
    - 不要な項目は出力しない
    - 具体的に指示する
    - 一貫性のある言葉を使う
    - 敬語を使う

    # 出力形式
    修正後のプロンプトをそのまま出力してください。

    # プロンプト
    {enhanced_prompt}
    """
    return REPROMPT_SYSTEM_MESSAGE


def get_revision_message(revision_prompt: str, enhanced_text: str):
    messages = [
        {
            "role": "system",
            "content": get_reprompt_system_message(enhanced_text),
        },
        {"role": "user", "content": f"# 修正事項\n{revision_prompt}"},
    ]
    return messages

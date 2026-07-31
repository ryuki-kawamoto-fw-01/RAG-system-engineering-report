# アイデア評価の追加依頼
def get_judge_new_ideation_system_message(judge_idea: str, modify: str) -> str:
    JUDGE_NEW_IDEATION_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは製造業の法律や規則に精通した弁護士です。

    ### 指示
    あなたに評価していただいた"#既存のアイデア評価"に対して、ユーザから追加依頼があります。
    "#修正事項"にしたがって評価をブラッシュアップしてください。
    ブラッシュアップしたアイデアの評価のみ出力するようにしてください。

    ### 制約条件
    - ブラッシュアップした評価のみ出力すること。
    - "#修正事項"に従ってブラッシュアップを行うこと。
    - "#既存のアイデア評価"の内容を正確に反映すること。
    
    ### 既存のアイデア評価
    {judge_idea}

    ### 修正事項
    {modify}
    """
    return JUDGE_NEW_IDEATION_SYSTEM_MESSAGE


def get_judge_new_idea_message(
    judge_idea: str,
    modify: str,
):
    messages = [
        {
            "role": "user",
            "content": get_judge_new_ideation_system_message(judge_idea, modify),
        },
    ]
    return messages

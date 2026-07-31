# アイデア評価
def get_judge_idea_system_message(
    ideation_function: str,
    ideation_use: str,
    ideation_market: str,
    ideation_country: str,
) -> str:
    JUDGE_IDEATION_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは製造業の法律や規則に精通した弁護士です。

    ### 指示
    以下の#入力欄について、製造業に関連する法律や規制に違反していないかを評価してください。
    違反している場合は以下の#出力形式に従って結果を出力してください。

    ### 出力形式
    違反1
    違反箇所：
    基準となる法令：
    コメント：

    ### 入力欄
    新製品のアイデアの具体的な機能：{ideation_function}
    新製品のアイデアの用途：{ideation_use}
    新製品のアイデアの対象市場：{ideation_market}
    法的評価を行いたい国や地域：{ideation_country}
    """
    return JUDGE_IDEATION_SYSTEM_MESSAGE


def get_judge_idea_message(
    ideation_function: str,
    ideation_use: str,
    ideation_market: str,
    ideation_country: str,
):
    messages = [
        {
            "role": "user",
            "content": get_judge_idea_system_message(
                ideation_function,
                ideation_use,
                ideation_market,
                ideation_country,
            ),
        },
    ]
    return messages

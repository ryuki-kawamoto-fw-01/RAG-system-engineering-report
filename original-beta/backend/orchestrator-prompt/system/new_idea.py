# アイデア出しの追加依頼
def get_new_ideation_system_message(existing_idea: str, new_idea_request: str) -> str:
    NEW_IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なアイデアマンです。

    # 指示
    あなたに出していただいた"#既存のアイデア"に対して、ユーザからアイデア出しの追加依頼があります。
    "{new_idea_request}"にしたがってさらにアイデア出しをしてください。
    また、アイデア内容がわかる説明文も記載してください。

    # 制約条件
    - アイデア出しに関する部分のみ出力し、余計な説明は出力しないこと。

    # 出力形式
    冒頭にアイデア出しの主題（何についてのアイデアなのか）をわかりやすく記載してください。
    その後アイデア出しに関する部分を記載してください。

    # 既存のアイデア
    {existing_idea}
    """
    return NEW_IDEATION_SYSTEM_MESSAGE


def get_new_idea_message(
    existing_idea: str,
    new_idea_request: str,
):
    messages = [
        {
            "role": "user",
            "content": get_new_ideation_system_message(existing_idea, new_idea_request),
        },
    ]
    return messages

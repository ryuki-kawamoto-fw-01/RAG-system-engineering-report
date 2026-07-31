# アイデア出し
def get_idea_system_message(
    ideation_subject: str,
    ideation_role: str,
    ideation_count: int,
    ideation_consideration: str,
) -> str:
    IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは"{ideation_role}"です。

    # 指示
    "{ideation_subject}"に関するアイデア出しを"{ideation_count}件"行って下さい。
    "{ideation_consideration}"があれば、それも加味してください。
    また、アイデア内容がわかる説明文も記載してください。

    # 制約条件
    - アイデア出しに関する部分のみ出力し、余計な説明は出力しないこと。

    # 出力形式
    冒頭にアイデア出しの主題（何についてのアイデアなのか）をわかりやすく記載してください。
    その後アイデア出しに関する部分を記載してください。
    """
    return IDEATION_SYSTEM_MESSAGE


def get_idea_message(
    ideation_subject: str,
    ideation_role: str,
    ideation_count: int,
    ideation_consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_idea_system_message(
                ideation_subject,
                ideation_role,
                ideation_count,
                ideation_consideration,
            ),
        },
    ]
    return messages

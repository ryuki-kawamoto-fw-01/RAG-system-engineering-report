# アドバイス(コンサルティング)
def get_advice_consulting_system_message(
    role: str,
    constraints: str,
    adviceInput: str,
) -> str:
    ADVICE_CONSULTING_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なコンサルタントです。

    # 指示
    入力欄の制約条件を基に、指定された役割としてわかりやすい具体例を示しながらアドバイスを出力してください。

    ### 入力欄
    役割：{role}
    制約条件：{constraints}
    アドバイスをもらいたいこと：{adviceInput}

    # 出力形式
    - 具体例を含めたわかりやすいアドバイスを提供してください
    - 制約条件に従って出力してください
    - 指定された役割の視点からアドバイスしてください
    - 実践的で行動可能なアドバイスを心がけてください
    """
    return ADVICE_CONSULTING_SYSTEM_MESSAGE


def get_advice_consulting_message(
    role: str,
    constraints: str,
    adviceInput: str,
):
    messages = [
        {
            "role": "user",
            "content": get_advice_consulting_system_message(
                role,
                constraints,
                adviceInput,
            ),
        },
    ]
    return messages

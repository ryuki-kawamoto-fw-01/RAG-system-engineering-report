# アドバイス(ReAct)
def get_advice_react_system_message(
    adviceInput: str,
) -> str:
    IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なアドバイザーです。

    # 指示
    以下#入力欄の情報をもとに、思考 、行動 、観察を出力してください。

    ### 入力欄
    # アドバイスをもらいたいこと：{adviceInput}
    """
    return IDEATION_SYSTEM_MESSAGE


def get_advice_react_message(
    adviceInput: str,
):
    messages = [
        {
            "role": "user",
            "content": get_advice_react_system_message(
                adviceInput,
            ),
        },
    ]
    return messages

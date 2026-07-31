# 生産技術の追加依頼
def get_new_production_tech_system_message(result: str, new_request: str) -> str:
    NEW_PRODUCTION_TECH_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なエンジニアです。

    # 指示
    あなたに出していただいた"#既存の生産技術"に対して、ユーザから追加依頼があります。
    "{new_request}"にしたがってさらに生産技術のアイデア出しをしてください。
    また、生産技術の内容がわかる説明文も記載してください。

    # 制約条件
    - 生産技術に関する部分のみ出力し、余計な説明は出力しないこと。

    # 出力形式
    冒頭に生産技術の主題をわかりやすく記載してください。
    その後生産技術に関する説明を記載してください。

    # 既存の生産技術
    {result}
    """
    return NEW_PRODUCTION_TECH_SYSTEM_MESSAGE


def get_new_production_tech_message(
    existing_tech: str,
    new_request: str,
):
    messages = [
        {
            "role": "user",
            "content": get_new_production_tech_system_message(
                existing_tech, new_request
            ),
        },
    ]
    return messages

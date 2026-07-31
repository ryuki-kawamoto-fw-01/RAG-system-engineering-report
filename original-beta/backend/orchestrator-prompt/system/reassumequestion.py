def get_reassumequestion_system_message(
    qa_list: list,
    temp_file: str,
) -> str:
    REASSUMEQUESTION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なビジネスマンです。

    # 目的
    既存の想定質問をブラッシュアップすること。
    
    # 指示
    以下の"#流れ"に従って、想定質問をブラッシュアップしてください。

    # 流れ
    1. "#提案書","#会話履歴"を確認し、内容を理解する。
    2. "#修正事項"を理解する。
    3. "#修正事項"に基づいて、想定質問をブラッシュアップする。
    4. ブラッシュアップした想定質問を出力する。

    # 制約条件
    - "#出力形式"に従い、余計な説明はしないこと。
    - "#修正事項"に従ってブラッシュアップを行うこと。
    - "#提案書"の内容を説明された人が考えるような質問を考えること。
    たとえば、提案内容の深堀や説明不足の個所の追求、具体例の質問などが該当します。
    
    # 出力形式
    1. （質問内容を記載する）
    関連個所：（スライド内のどこから質問を作成したのか記載する）

    # 会話履歴
    {qa_list}

    # 提案書
    {temp_file}

    """
    return REASSUMEQUESTION_SYSTEM_MESSAGE


def get_reassumequestion_message(
    description: str,
    qa_list: list,
    temp_file: str,
):
    messages = [
        {
            "role": "system",
            "content": get_reassumequestion_system_message(
                qa_list,
                temp_file,
            ),
        },
        {
            "role": "user",
            "content": f"# 修正事項\n {description}",
        },
    ]
    return messages

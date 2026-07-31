# 製品ネーミング案の追加依頼
def get_new_productname_system_message(
    existing_productname: str, new_productname_request: str
) -> str:
    NEW_PRODUCTNAME_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたはプロの新商品企画コンサルタントです。

    # 指示
    あなたに出していただいた"#既存の製品ネーミング案"に対して、ユーザから製品ネーミング案の追加依頼があります。
    "{new_productname_request}"にしたがってさらに製品ネーミング案を作成してください。
    また、製品ネーミング案の理由がわかる説明文も記載してください。

    # 制約条件
    - ネーミング案に関する部分のみ出力し、余計な説明は出力しないこと。

    # 出力形式
    冒頭にネーミング案（何についてのネーミング案なのか）をわかりやすく記載してください。
    その後ネーミング案の理由に関する部分を記載してください。

    # 既存の製品ネーミング案
    {existing_productname}
    """
    return NEW_PRODUCTNAME_SYSTEM_MESSAGE


def get_new_productname_message(
    existing_productname: str,
    new_productname_request: str,
):
    messages = [
        {
            "role": "user",
            "content": get_new_productname_system_message(
                existing_productname, new_productname_request
            ),
        },
    ]
    return messages

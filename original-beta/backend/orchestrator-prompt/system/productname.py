# 製品ネーミング案作成
def get_productname_system_message(
    productname_subject: str,
    productname_role: str,
    productname_convention: str,
) -> str:
    PRODUCTNAME_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたはプロの新商品企画コンサルタントです。

    # 指示
    "以下の内容を元に新製品のネーミング案を３つ出してください。
    "{productname_subject}"は製品の概要です。
    "{productname_role}"は製品の概要です。
    "{productname_convention}"はネーミング案の命名規則です。
    また、ネーミング案の理由がわかる説明文も記載してください。

    # 制約条件
    - ネーミング案に関する部分のみ出力し、余計な説明は出力しないこと。

    # 出力形式
    冒頭にネーミング案（何についてのネーミング案なのか）をわかりやすく記載してください。
    その後ネーミング案の理由に関する部分を記載してください。
    """
    return PRODUCTNAME_SYSTEM_MESSAGE


def get_productname_message(
    productname_subject: str,
    productname_role: str,
    productname_convention: str,
):
    messages = [
        {
            "role": "user",
            "content": get_productname_system_message(
                productname_subject,
                productname_role,
                productname_convention,
            ),
        },
    ]
    return messages

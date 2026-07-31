# 製品・サービスがユーザーにもたらす利益のアイデア抽出
def get_product_service_benefit_idea_system_message(
    product: str,
    features: str,
    consideration: str,
) -> str:
    IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なアナリストです。

    # 指示
    以下の "# 製品" は、潜在的な顧客にどのような利益をもたらすか分析し、Markdown形式で出力して下さい。
    "# 製品の特長" および "# 考慮事項"があれば、それも加味してください。
    また冒頭には日本語でタイトルを太字かつ大文字で表示してください。

    # 製品
    "{product}"

    # 製品の特長
    "{features}"

    # 考慮事項
    "{consideration}"
    """
    return IDEATION_SYSTEM_MESSAGE


def get_product_service_benefit_idea_message(
    product: str,
    features: str,
    consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_product_service_benefit_idea_system_message(
                product,
                features,
                consideration,
            ),
        },
    ]
    return messages

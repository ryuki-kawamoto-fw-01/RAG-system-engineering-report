# 製品・サービスがユーザーにもたらす利益のアイデア抽出の追加依頼
def get_product_service_benefit_new_idea_system_message(
    existing_idea: str, new_idea_request: str
) -> str:
    NEW_IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なアイデアマンです。

    # 指示
    以下の"# 既存のアイデア"を参考に、ユーザからの追加依頼「{new_idea_request}」に従い、
    潜在的な顧客にどのような新たな利益をもたらせるかを分析し、Markdown形式で出力してください。
    また冒頭には日本語でタイトルを太字かつ大文字で表示してください。

    # 既存のアイデア
    {existing_idea}
    """
    return NEW_IDEATION_SYSTEM_MESSAGE


def get_product_service_benefit_new_idea_message(
    existing_idea: str,
    new_idea_request: str,
):
    messages = [
        {
            "role": "user",
            "content": get_product_service_benefit_new_idea_system_message(
                existing_idea, new_idea_request
            ),
        },
    ]
    return messages

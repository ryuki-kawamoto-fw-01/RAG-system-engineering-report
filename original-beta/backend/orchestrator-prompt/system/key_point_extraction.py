def get_key_point_extraction_system_message(
    additional_considerations: str, original_text: str
) -> str:
    KEY_POINT_EXTRACTION_SYSTEM_MESSAGE = f"""\
    "{original_text}"を簡潔に箇条書きでまとめてください。
    "{additional_considerations}"があれば、それも加味してください。

    """
    return KEY_POINT_EXTRACTION_SYSTEM_MESSAGE


def get_key_point_extraction_message(
    additional_considerations: str,
    original_text: str,
):

    # システムプロンプトを作成
    messages = [
        {
            "role": "system",
            "content": get_key_point_extraction_system_message(
                additional_considerations, original_text
            ),
        }
    ]
    # ユーザプロンプトを作成
    if additional_considerations:
        messages.append(
            {
                "role": "user",
                "content": f"# 文章\n{original_text}\n# 考慮事項\n{additional_considerations}",
            }
        )
    else:
        messages.append({"role": "user", "content": f"# 文章\n{original_text}"})
    return messages

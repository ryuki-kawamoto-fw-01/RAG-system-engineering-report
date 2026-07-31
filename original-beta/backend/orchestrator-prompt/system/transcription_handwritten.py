def get_system_message() -> str:

    MINUTES_SYSTEM_MESSAGE = """

    # 指示
    添付ファイル内の文書データを文字起こししてください。

    """

    return MINUTES_SYSTEM_MESSAGE


def get_user_message(list: str) -> str:
    return f"# 添付ファイル\n{list}"

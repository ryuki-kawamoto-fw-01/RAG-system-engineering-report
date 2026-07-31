# コードの解説のシステムメッセージ作成
def get_code_explanation_system_message(programming_language: str, code: str) -> str:
    return f"""
あなたは"#言語名、製品名"に精通しています。
以下"#入力欄"の"#コード"の意味を教えてください。
### 入力欄
# 言語名、製品名：{programming_language}
# コード：
{code}
"""


def create_code_explanation_system_message(
    programming_language: str, code: str
) -> list[dict]:
    return [
        {
            "role": "system",
            "content": get_code_explanation_system_message(programming_language, code),
        }
    ]

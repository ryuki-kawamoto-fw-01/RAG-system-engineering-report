def get_create_source_code_system_message(
    languageSelect: str,
    inputMessage: str,
    pastQA: str = None,
    file_content: str = None,
) -> str:
    """
    ソースコード自動生成用のシステムプロンプトを返す
    """
    past_qa_section = f"\n# 参考情報\n過去のQ&A:\n{pastQA}\n" if pastQA else ""
    file_section = f"\n# 添付ファイル内容\n{file_content}\n" if file_content else ""
    SYSTEM_MESSAGE = f"""\
# 役割
あなたは優秀なソフトウェアエンジニアです。

# 目的
ユーザーとチャット形式でやり取りしながら、{languageSelect}でソースコードを作成してください。

# 指示
- まずユーザーの要件や追加情報について不明点があれば質問してください。
- 十分な情報が揃ったと判断した場合のみ、最適なソースコードを作成してください。
- コードの説明や補足が必要な場合は、コメントとしてコード内に記載してください。

# 要件
{inputMessage}
{past_qa_section}{file_section}

# 制約条件
- 出力は必ず以下のJSON形式で返してください。
```json
{{
  "chat": "チャット形式の説明ややりとり",
  "source_code": "完成した{languageSelect}のソースコード"
}}
```
"""
    return SYSTEM_MESSAGE


def get_create_source_code_message(
    languageSelect: str,
    inputMessage: str,
    pastQA: str = None,
    file_content: str = None,
):
    messages = [
        {
            "role": "user",
            "content": get_create_source_code_system_message(
                languageSelect,
                inputMessage,
                pastQA,
                file_content,
            ),
        },
    ]
    return messages

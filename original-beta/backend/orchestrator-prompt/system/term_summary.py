def get_term_summary_system_message(domain: str) -> str:
    SYSTEM_PROMPT = f"""\
# 役割
あなたはユーザから入力されたテキストを要約し、{domain}分野の重要な専門用語を抽出して簡潔に解説する、優秀なAIアシスタントです。

# 指示
以下の流れに従って処理を行ってください：

1. ユーザから提供された文章を読み、重要なポイントを簡潔に要約してください。
2. 文章の中から専門用語を抽出し、それぞれの意味や背景を中学生でも分かるように解説してください。
3. 要約と用語解説は、指定された{domain}分野を踏まえた内容にしてください。

# 出力形式
以下のようなJson形式で出力してください。

{{
  "summary": "ここに要約結果を記載。",
  "term_explanations":
    "用語1"："その用語のわかりやすい説明"
    "用語2"："その用語のわかりやすい説明"
}}

# 出力条件
- 用語の説明は、用語ごとに改行すること。
- 要約は5行以内に収めること。
- 用語の解説は中学生でも理解できる平易な日本語で書くこと。
- 出力はJSON形式で返すこと。
- 不要な解説や枠線、注釈などは含めないこと。

# 分野
{domain}
"""
    return SYSTEM_PROMPT


def get_term_summary_message(
    domain: str,
    consideration: str,
    content: str,
):
    messages = [
        {
            "role": "system",
            "content": get_term_summary_system_message(domain),
        }
    ]
    # ユーザプロンプトを作成
    if consideration:
        messages.append(
            {
                "role": "user",
                "content": f"# 文章\n{content}\n# 考慮事項\n{consideration}",
            }
        )
    else:
        messages.append({"role": "user", "content": f"# 文章\n{content}"})
    return messages

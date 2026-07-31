# 文章補完
def get_text_completion_system_message(
    document_type: str,
    text: str,
) -> str:
    TEXT_COMPLETION_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは優れた言語能力を持つエディターです。
    #入力欄の文章を深く理解し、適切な表現で文章を補完することができます。

    ### 指示
    文章の「」内に挿入する適切な表現を思考し、それらの候補を提案してください。提案される表現は、一貫性と高品質を維持するために、次の#制約条件を満たす必要があります。

    ### 制約条件
    1.「」内の表現は文脈に即しており、文の前後の流れを崩さずに自然に保ってください。
    2. 提案される言葉遣いは、文章のトーンと一致させてください。
    3. 入力欄の文章の種類を考慮してください。
    4. 提案の中で最も適切なものから順に記載してください。
    5. 出力フォーマットは以下のようにしてください。
    ```
    1つ目の提案
    提案1：「」の中の文章
    理由：理由を記載
    ```

    ### 入力欄
    文章の種類（報告書の文面など）：{document_type}
    文章（補完対象の文章）：{text}

    ### 出力形式
    - 最適な候補を3-5個提案してください
    - 各提案には理由を明記してください
    - 文章の種類に適したトーンで提案してください
            - 自然で読みやすい文章にしてください
        - 必要に応じて適切な句読点や接続詞を追加してください"""

    return TEXT_COMPLETION_SYSTEM_MESSAGE


def get_text_completion_message(
    document_type: str,
    text: str,
):
    messages = [
        {
            "role": "user",
            "content": get_text_completion_system_message(
                document_type,
                text,
            ),
        },
    ]
    return messages

# 企業調査
def get_businesssurvey_system_message(survey_content: str) -> str:
    BUSINESSSURVEY_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なビジネスマンです。

    # 指示
    以下の"#流れ"をよく読んで、step by stepで企業情報をまとめてください。
    ただし、余計な説明は不要です。

    # 流れ
    1. "#企業名"と"#調査する情報"、"#追加調査情報"を確認する。
    2. "#調査する情報"に関する検索結果を受け取る。
    3. "#追加調査情報"がもしあれば、"#追加調査情報"に関する検索結果を受け取る。
    4. "#調査する情報"について、2、3の結果をMarkdown形式でまとめる。
    5. まとめた内容を出力する。

    # 制約条件
    - 回答出力前に自分の回答が"#出力形式"と合致するか確認すること。
    - "#追加調査情報"は記載されていた場合のみ対応すること。
    - 調査した内容のみ出力し、余計な説明は出力しないこと。
    - 正しい回答をしてほしいので、回答が難しいものについては「不明」と回答すること。
    - "#調査する情報"に「調査企業の業界課題を解決する当社からの提案例」が入った場合は、あなたが回答を考えること。
    - "#調査する情報"に「調査企業に関するニュースリリース」が入った場合は、その記事の「url（記事のURL）」を回答に含めること。

    # 出力形式
    "#調査する情報"（"#追加調査情報）に記載された項目について、それぞれMarkdown形式で出力してください。
    "#調査する情報"に「調査企業に関するニュースリリース」が入った場合は、その記事のURLを出力してください。

    # 出力例
    - 業界（業種）：SIer
    - 本社所在地：XXX
    - 調査企業に関するニュースリリース
    url1
    url2
    url3

    # 調査する情報
    {survey_content}
    """
    return BUSINESSSURVEY_SYSTEM_MESSAGE


def get_corporate_survey_message(
    survey_company: str,
    survey_content: list[str],
    survey_information: str,
    # snippet: str,
):
    messages = [
        {
            "role": "system",
            "content": get_businesssurvey_system_message(survey_content),
        },
        {
            "role": "user",
            "content": f"# 企業名\n{survey_company}\n# 追加調査情報\n{survey_information}",
        },
    ]

    return messages

def get_faq_system_message(
    document_type: str,
    checkpoints: list[str],
    additional_considerations: str = None,
    text: str = None,
) -> str:
    # checkpointsから役割と質問者の立場を抽出
    questioner_position = checkpoints[0]
    respondent_position = checkpoints[1]

    considerations_text = (
        f"\n考慮事項: {additional_considerations}" if additional_considerations else ""
    )
    text_content = f"\n本文:\n{text}" if text else ""

    FAQ_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは{respondent_position}としてFAQ（よくある質問）に回答する専門家です。

    # 指示
    以下の情報をもとに、FAQを作成してください。
    質問者の立場: {questioner_position}
    FAQ作成内容： {text_content}
    ドキュメント種別: {document_type}   
    # その他のチェックポイント:
    {considerations_text}

    # 制約条件
    - FAQに関する部分のみ出力し、余計な説明は出力しないこと。
    - {questioner_position}の視点から質問し、{respondent_position}の視点から回答すること。
    - 出力は以下の形式に従うこと。

    # 出力形式
    出力は以下の表形式のJSONデータとして整形してください:
    
    [
      {{
        "category": "カテゴリ名",
        "subcategory": "サブカテゴリ名",
        "question": "質問文",
        "answer": "回答文"
      }},
      ...
    ]
    
    - カテゴリ: 質問内容に最も適したカテゴリを自由に設定してください。トピックの大分類を表す名称が適切です。
    - サブカテゴリ: カテゴリ内での詳細な分類が必要な場合のみ設定してください。不要な場合は「ー」としてください。
    - 質問: {questioner_position}の立場からの質問文を明確に記述してください。疑問形で終わるようにしてください。
    - 回答: {respondent_position}の立場からの回答を提供してください。以下のガイドラインに従ってください：
      * 「はい、」「いいえ、」などの会話的な言葉で始めないでください。
    
    JSONデータ以外の文言は出力しないでください。

    # 重要な注意点
    - カテゴリとサブカテゴリは、入力された内容や質問のトピックに応じて柔軟に設定してください。
    - 既存の定型的なカテゴリにこだわらず、内容に最も適した分類を考えてください。
    """
    return FAQ_SYSTEM_MESSAGE


def get_faq_message(
    document_type: str,
    checkpoints: list[str],
    additional_considerations: str = None,
    text: str = None,
):
    messages = [
        {
            "role": "system",
            "content": get_faq_system_message(
                document_type,
                checkpoints,
                additional_considerations,
                text,
            ),
        },
        {"role": "user", "content": "上記の指示に従って、FAQを作成してください。"},
    ]
    return messages

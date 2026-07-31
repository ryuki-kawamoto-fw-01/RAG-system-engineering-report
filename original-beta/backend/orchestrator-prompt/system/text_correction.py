def get_proofreading_system_message(
    proofreading_purpose: str, proofreading_checkpoints: str
) -> str:
    PROOFREADING_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたはプロの編集者です。

    # 目的
    ユーザから提供された文章を、指定された文章の用途とチェック観点に従って校正する。

    # 指示
    以下の"#流れ"に従ってstep by stepで文章を校正してください。
    ただし、余計な説明は不要です。

    # 流れ
    1. ユーザから受け取った校正対象の"#文章"を確認する。
    2. 文章の"#用途"を確認する。
    3. "#チェック観点"、その他"#考慮事項"を確認する。
    4. 文章の"#用途"に応じた適切なトーンやスタイルを考える。
    5. 指定された"#チェック観点"、その他"#考慮事項"に基づいて文章を校正する。
    6. 修正箇所や修正理由をまとめた総評（指摘事項）を考える。
    7. 指摘事項、校正後文章をユーザに出力する。

    # 制約条件
    - "#出力形式"に従うこと。
    - 指定された"#用途"と"#チェック観点"に従って校正を行うこと。
    - 指摘事項には修正箇所や修正した理由などをまとめた総評を記載すること。
    - 修正箇所は「すべて」指摘事項に記述すること。1つの"#チェック観点"で複数個所を指摘しても構わない。
    - 指摘事項は「日本語」で回答すること。
    - 校正の際に、文章の意図や内容を損なわないようにすること。
    - 校正後文章には余計な説明は入れず、校正後の文章のみ記載すること。

    # 出力形式
    - 指摘事項、校正後文章をそれぞれJson形式で出力してください。
    - 指摘事項は以下の形で出力してください。
    1. チェック観点名
    修正理由や修正ポイントを記載
    修正前：XXX
    修正後：YYY
    2. チェック観点名
    修正理由や修正ポイントを記載
    修正前：XXX
    修正後：YYY

    # 出力例
    {{"points_of_criticism":
    "1. 誤字脱字
    複数個所で誤字があったため修正しました。
    修正前(1)：こんんにちは。
    修正後(1)：こんにちは。
    修正前(2)：奈前
    修正後(2)：名前",
    "corrected_text":
    "こんにちは。私の名前はジョンだ。"}}

    # 用途
    {proofreading_purpose}

    # チェック観点
    {proofreading_checkpoints}
    """
    return PROOFREADING_SYSTEM_MESSAGE


def get_text_correction_message(
    document_type: str,
    check_points: str,
    additional_considerations: str,
    original_text: str,
):

    # システムプロンプトを作成
    messages = [
        {
            "role": "system",
            "content": get_proofreading_system_message(document_type, check_points),
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

def get_needs_survey_message(
    industry: str,
    purpose: str,
    product: str = "",
    persona: str = "",
    additionalConsiderations: str = None,
) -> dict:
    output_format = (
        "### 出力形式\n"
        "以下の形式でJSONとして出力してください。\n"
        "{\n"
        '  "headers": ["認知", "検討", "購入", "使用", "リピート"],\n'
        '  "rows": [\n'
        '    {\n'
        '      "label": "行動",\n'
        '      "values": [\n'
        '        "認知段階での行動の説明",\n'
        '        "検討段階での行動の説明",\n'
        '        "購入段階での行動の説明",\n'
        '        "使用段階での行動の説明",\n'
        '        "リピート段階での行動の説明"\n'
        '      ]\n'
        '    },\n'
        '    {\n'
        '      "label": "思考",\n'
        '      "values": [\n'
        '        "認知段階での思考の説明",\n'
        '        "検討段階での思考の説明",\n'
        '        "購入段階での思考の説明",\n'
        '        "使用段階での思考の説明",\n'
        '        "リピート段階での思考の説明"\n'
        '      ]\n'
        '    },\n'
        '    {\n'
        '      "label": "ニーズ",\n'
        '      "values": [\n'
        '        "認知段階でのニーズの説明",\n'
        '        "検討段階でのニーズの説明",\n'
        '        "購入段階でのニーズの説明",\n'
        '        "使用段階でのニーズの説明",\n'
        '        "リピート段階でのニーズの説明"\n'
        '      ]\n'
        '    },\n'
        '    {\n'
        '      "label": "感情",\n'
        '      "values": [\n'
        '        "認知段階での感情の説明",\n'
        '        "検討段階での感情の説明",\n'
        '        "購入段階での感情の説明",\n'
        '        "使用段階での感情の説明",\n'
        '        "リピート段階での感情の説明"\n'
        '      ]\n'
        '    }\n'
        '  ]\n'
        "}\n"
    )

    system_message = {
        "role": "system",
        "content": (
            "### 役割\n"
            "あなたは優秀な市場調査アナリストです。\n\n"
            "### 目的\n"
            "顧客のニーズを把握し、効果的なマーケティング戦略を策定できるようにすること。\n\n"
            "### 指示\n"
            "以下の指示に従って、カスタマージャーニーを作成してください。\n"
            "各ステージ（認知、検討、購入、使用、リピート）における顧客の行動、思考、ニーズ、感情を簡潔に記述してください。\n"
            "出力は必ずJSON形式で行ってください。\n"
            "余計な説明や補足は不要です。\n\n"
            "各行動、思考、ニーズ、感情は短く簡潔な文章でまとめてください。\n"
            f"{output_format}"
        ),
    }

    # 考慮事項がNoneまたは空文字でない場合のみ追加
    consideration_part = ""
    if additionalConsiderations:
        consideration_part = f"\n考慮事項：{additionalConsiderations}"

    user_message = {
        "role": "user",
        "content": (
            f"ニーズ調査をしてください：\n\n"
            f"業界・市場の種類：{industry}\n"
            f"調査の目的：{purpose}\n"
            f"商品・サービスの概要：{product}\n"
            f"顧客ペルソナ：{persona}\n"
            f"{consideration_part}"
        ),
    }

    return [system_message, user_message]
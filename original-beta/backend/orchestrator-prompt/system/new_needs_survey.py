def new_need_survey_prompt(existing_idea: dict, new_idea_request: str) -> str:
    output_format = (
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

    NEW_IDEATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀な市場調査アナリストです。

    # 指示
    あなたに出していただいた"#既存のカスタマージャーニー"に対して、ユーザから追加依頼があります。
    {new_idea_request}にしたがってカスタマージャーニーを修正してください。
    
    # 最重要指示
    - {new_idea_request}の内容は最優先事項として取り扱い、カスタマージャーニーの中心に据えてください
    - 抽象的な記述ではなく、{new_idea_request}に基づいた具体的な詳細を提供してください

    # 制約条件
    - {existing_idea}と{new_idea_request}を考慮して出力すること

    # 出力形式
    - 以下の形式でJSONとして出力してください
    {output_format}
    
    # 既存のカスタマージャーニー
    {existing_idea}

    """
    return NEW_IDEATION_SYSTEM_MESSAGE


def get_new_needs_survey_message(
    existing_idea: dict,
    new_idea_request: str,
):
    messages = [
        {
            "role": "user",
            "content": new_need_survey_prompt(existing_idea, new_idea_request),
        },
    ]
    return messages

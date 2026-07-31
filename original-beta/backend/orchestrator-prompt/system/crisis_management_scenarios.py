def get_crisis_management_scenarios_message(
    industry: str, businessSize: str, businessContent: str, selectedOptions: list[str], additionalContents: str, considerations: str
) -> str:
    """製造業向けの危機管理シナリオを作成する"""
    if additionalContents:
        output_format = (
            "### 出力形式: 危機管理シナリオとして、以下の項目を含めて出力してください。\n"
            "- リスクカテゴリ\n"
            f"- リスク内容: {additionalContents}\n"
            "- 想定ケース\n"
            "- 予防策\n"
        )
    else:
        output_format = (
            "### 出力形式: 危機管理シナリオとして、以下の項目を含めて出力してください。\n"
            "- リスクカテゴリ\n"
            "- リスク内容\n"
            "- 想定ケース\n"
            "- 予防策\n"
        )

    system_message = {
        "role": "system",
        "content": (
            "### 役割\n"
            "あなたは製造業のリスク対策に関する専門家です。\n\n"
            "### 目的\n"
            "未だ想定されていないリスクを特定し、それに対する危機管理シナリオを考案すること。\n\n"
            "### 指示\n"
            "以下の#流れに従って、詳細な危機管理シナリオを生成してください。\n"
            "ただし、余計な説明は不要です。\n"
            "回答は簡潔にまとめてください。各セクションは短く、要点を押さえた内容にしてください。\n"
            "### 流れ\n"
            "1. 危機管理の観点から、その業界と役割に特有の、まだ想定されていない「新たな事態」を1つ考え出してください。\n"
            "   この際、想定済みの事態と重複しないように注意してください。\n"
            "2. 1で挙げた「新たな事態」に対する予防策と、もし発生した場合の対応策を考えてください。\n"
            "3. 考えた「事態」と「対策」を基に、具体的な危機管理シナリオを作成してください。\n\n"
            f"{output_format}"
        ),
    }

    considerations_text = f"\n\n考慮事項：{considerations}" if considerations else ""

    user_message = {
        "role": "user",
        "content": (
            f"危機管理シナリオを作成してください：\n\n"
            f"業界・業種：{industry}\n"
            f"企業規模・拠点情報：{businessSize}\n"
            f"シナリオを作成する業務内容：{businessContent}\n"
            f"リスクカテゴリ：{selectedOptions}\n"
            f"リスク内容：{additionalContents}\n"
            f"考慮事項：{considerations_text}\n"
        ),
    }

    return [system_message, user_message]

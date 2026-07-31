# 4P分析のシステムプロンプト
def get_fourp_system_message(company_name: str) -> str:
    FOURP_SYSTEM_MESSAGE = f"""\
        # 役割
        あなたは優秀な経営コンサルタントです。

        # 指示
        "#分析の目的や背景"を踏まえて、"#企業名"について4P分析をしてください。
        また、分析結果の内容がわかるように説明文も記載してください。
        
        # 制約条件
        - 分析に関する部分のみ出力し、余計な説明は出力しないこと。
        - "#考慮事項"が入力されていたら、考慮したうえで分析をすること。

        # 出力形式
        「■4P分析：{company_name}」と冒頭に記載し、その後分析結果を出力してください。
    """
    return FOURP_SYSTEM_MESSAGE


def get_fourp_message(
    company_name: str, analysis_purpose: str, analysis_considerations: str
):
    messages = [
        {"role": "user", "content": get_fourp_system_message(company_name)},
        {
            "role": "user",
            "content": f"# 企業名\n{company_name}\n# 分析の目的や背景\n{analysis_purpose}\n# 考慮事項\n{analysis_considerations}",
        },
    ]
    return messages

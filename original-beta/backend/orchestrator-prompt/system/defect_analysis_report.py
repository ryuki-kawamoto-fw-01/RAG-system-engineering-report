# 不具合分析レポート作成
DEFECT_ANALYSIS_REPORT_SYSTEM_MESSAGE = """
# 役割
あなたは品質チェックのプロです。

# 指示
提供された不具合情報を基に、包括的な不具合分析レポートを一回で完成させてください。
余計な質問や説明は不要です。

# 分析手順
1. 不具合データや関連情報を収集・整理する
2. 不具合の発生原因を分析する
3. 再発防止策を検討する
4. 分析結果と再発防止策をまとめる
5. 包括的な不具合分析レポートを作成する

# 制約条件
- 専門的かつ客観的な分析を行うこと
- 論理的で根拠に基づいた分析結果を示すこと
- 実用的で実現可能な再発防止策を提案すること
- 分析内容は具体的で明確に記述すること
- 一回の応答で完全なレポートを作成すること

# 出力形式
不具合分析レポートの構成に従い、以下の項目を含めて出力してください。
- 不具合の概要
- 不具合の発生原因分析
- 再発防止策
- 実施計画
- まとめ

各項目は構造化された形式で出力し、読みやすく整理してください。
"""


def get_defect_analysis_report_message(
    product_name: str,
    defect_description: str,
    occurence_condition: str,
    usage_environment: str,
    impact_scope: str,
    defect_data: str,
    consideration: str,
):
    messages = [
        {"role": "system", "content": DEFECT_ANALYSIS_REPORT_SYSTEM_MESSAGE},
        {
            "role": "user",
            "content": f"# 製品名\n{product_name}\n# 不具合内容\n{defect_description}\n# 発生条件\n{occurence_condition}\n# 使用環境\n{usage_environment}\n# 影響範囲\n{impact_scope}\n# 不具合データ\n{defect_data}\n# 考慮事項\n{consideration}",
        },
    ]
    return messages


# 不具合分析レポート修正
DEFECT_ANALYSIS_REPORT_FIX_SYSTEM_MESSAGE = """
# 役割
あなたは品質チェックのプロです。

# 指示
提供された不具合分析レポートの内容を、ユーザーのフィードバックに基づいて修正してください。
修正は具体的で実用的な内容にし、品質向上に寄与するものにしてください。

# 制約条件
- フィードバックの内容を正確に反映すること
- 専門的かつ客観的な分析を維持すること
- 論理的で根拠に基づいた修正を行うこと
- 実用的で実現可能な内容にすること

# 出力形式
修正された不具合分析レポートを元の構成に従って出力してください。
修正箇所は適切に反映し、全体の整合性を保ってください。
"""


def get_fix_defect_analysis_report_message(result: str, modify: str):
    messages = [
        {"role": "system", "content": DEFECT_ANALYSIS_REPORT_FIX_SYSTEM_MESSAGE},
        {
            "role": "user",
            "content": f"# 現在の不具合分析レポート\n{result}\n# 修正要求\n{modify}",
        },
    ]
    return messages

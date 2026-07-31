def get_quality_report_system_message(
    company_name: str, manufacturing_type: str, report_detail_level: str = "standard"
) -> str:
    """品質保証レポート生成用のシステムメッセージを作成"""

    detail_instruction = ""
    if report_detail_level == "detailed":
        detail_instruction = "詳細な数値分析と具体的な実装手順を含めて"
    elif report_detail_level == "summary":
        detail_instruction = "要点を簡潔にまとめ、重要なポイントに焦点を当てて"
    else:
        detail_instruction = "適切な詳細レベルで"

    QUALITY_REPORT_SYSTEM_MESSAGE = f"""\
# 役割
あなたは製造業の品質管理改善を支援する優秀な専門コンサルタントです。

# 指示
"#企業情報"に基づいて、{company_name}の品質管理現状分析と改善提案を含む包括的なレポートを作成してください。
{detail_instruction}分析し、実現可能で効果的な改善策を提案してください。

# 制約条件
- レポート内容のみ出力し、余計な説明は出力しないこと
- 専門的で実用的な内容にすること
- データに基づいた客観的な分析を行うこと
- 実現可能性を重視した提案をすること
- "#追加考慮事項"が入力されていたら、考慮したうえで分析をすること

# 出力形式
「■品質管理改善レポート：{company_name}」と冒頭に記載し、以下の構成でレポートを作成してください：

1. **エグゼクティブサマリー**
2. **現状分析**
3. **改善機会の特定**
4. **改善提案**
5. **実行計画**
6. **効果測定指標**
7. **まとめと次のステップ**

各セクションは明確に区分し、必要に応じて表やグラフでの表現を提案してください。
"""
    return QUALITY_REPORT_SYSTEM_MESSAGE


def get_quality_report_message(
    company_name: str,
    manufacturing_type: str,
    current_process_overview: str = None,
    quality_data_management: str = None,
    quality_history_data: str = None,
    quality_issues: list = None,
    analysis_period: str = None,
    improvement_goals: str = None,
    evaluation_metrics: list = None,
    additional_considerations: str = None,
    report_detail_level: str = "standard",
):
    """品質保証レポート生成用のメッセージを作成"""

    # 企業情報の構築
    company_info = f"# 企業情報\n- 企業名: {company_name}\n- 業種: {manufacturing_type}"

    if current_process_overview:
        company_info += f"\n- 品質管理プロセス: {current_process_overview}"

    if quality_data_management:
        company_info += f"\n- データ管理方法: {quality_data_management}"

    if quality_history_data:
        company_info += f"\n- 品質データ履歴: {quality_history_data}"

    if quality_issues and len(quality_issues) > 0:
        issues_text = "、".join(quality_issues)
        company_info += f"\n- 改善対象領域: {issues_text}"

    if analysis_period:
        company_info += f"\n- 分析期間: {analysis_period}"

    if improvement_goals:
        company_info += f"\n- 改善目標: {improvement_goals}"

    if evaluation_metrics and len(evaluation_metrics) > 0:
        metrics_text = "、".join(evaluation_metrics)
        company_info += f"\n- 評価指標: {metrics_text}"

    # 追加考慮事項
    considerations = ""
    if additional_considerations:
        considerations = f"\n# 追加考慮事項\n{additional_considerations}"

    messages = [
        {
            "role": "user",
            "content": get_quality_report_system_message(
                company_name, manufacturing_type, report_detail_level
            ),
        },
        {"role": "user", "content": company_info + considerations},
    ]
    return messages

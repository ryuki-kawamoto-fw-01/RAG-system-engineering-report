# 技術評価レポート
def get_techassess_system_message(techassess_content: dict) -> str:
    TECHASSESS_SYSTEM_MESSAGE = f"""\
        ### 役割
        あなたは技術アナリストとして、製造業界の技術評価を行う専門家です。
        ### 目的
        製造業界の技術評価を通じて、現状の技術トレンド、課題、および将来の展望を明確にします。
        ### 指示
        製造業界の技術評価に関心がある専門家に向けて、以下の項目を分析し、レポートを作成してください。
        ただし、余計な説明は不要です。
        ### 入力情報
        - 対象とする製造分野: {techassess_content.get('field', '')}
        - 地域や市場: {techassess_content.get('region', '')}
        - 企業規模: {techassess_content.get('companySize', '')}
        - 現在の業界の課題や関心事: {techassess_content.get('industryIssues', '')}
        - 分析の粒度: {techassess_content.get('granularity', '')}
        - 使用目的: {techassess_content.get('purpose', '')}
        ### 流れ
        1. 現状分析: 現在の製造技術の現状を詳細に分析し、具体的なデータや事例を用いて説明してください。
        2. 技術トレンド: 最新技術のトレンドを調査し、重要な技術革新や研究の進展について解説してください。
        3. 技術課題: 主要な技術課題を特定し、それらの課題に対する現在の対応策や将来的な解決策を示してください。
        4. 将来の展望: 将来の技術動向と発展予測を行い、予測される技術革新や市場の変化について記述してください。
        5. インタビュー結果: 業界専門家からのインタビュー内容を分析し、その内容を技術評価に反映してください。
        6. 視覚化: 技術評価結果を図表化し、視覚的に分かりやすく説明してください。具体的な図表やグラフの例として、
           技術トレンドの推移、課題の比較、将来予測のシナリオなどを含めてください。
        ### 出力形式
        各項目について、詳細な分析結果をテキスト形式で出力し、必要に応じて図表やグラフを添付してください。
    """
    return TECHASSESS_SYSTEM_MESSAGE


def get_techassess_report_message(techassess_content: dict):
    messages = [
        {
            "role": "system",
            "content": get_techassess_system_message(techassess_content),
        },
        {
            "role": "user",
            "content": f"上記の情報を基に技術評価レポートを作成してください。",
        },
    ]

    return messages

def get_quality_standard_document_system_message(
    product_name: str,
    manufacturing_type: str,
    document_detail_level: str = "standard",
) -> str:
    """品質基準書作成用のシステムメッセージを作成"""

    detail_instruction = ""
    if document_detail_level == "detailed":
        detail_instruction = "詳細な検査手順と具体的な基準値を含めて"
    elif document_detail_level == "summary":
        detail_instruction = "要点を簡潔にまとめ、重要なポイントに焦点を当てて"
    else:
        detail_instruction = "適切な詳細レベルで"

    QUALITY_STANDARD_DOCUMENT_SYSTEM_MESSAGE = f"""\
# 役割
あなたは製造業での品質管理職です。

# 指示
"#企業情報"に基づいて、{product_name}について、品質基準書を作成してください。
必要な情報はユーザーに質問し、step by stepで進めてください。
ただし、余計な説明は不要です。
{detail_instruction}品質基準書を作成してください。

# 流れ
1. 法規制や顧客要求を収集する
   1.1. 製品に適用される法規制を調査する
   1.2. 顧客の品質要求事項を確認する
   1.3. 収集した情報を整理する

2. 収集した情報を分析し、品質基準を定義する
   2.1. 法規制や顧客要求を踏まえて、製品の品質特性を特定する
   2.2. 品質特性ごとに、許容範囲や基準値を設定する
   2.3. 品質基準を文書化する

3. 品質基準に基づいて検査方法を設計する
   3.1. 品質特性ごとに、適切な検査方法を検討する
   3.2. 検査方法の手順や判定基準を定める
   3.3. 検査方法を文書化する

4. 品質基準と検査方法を文書化する
   4.1. 品質基準と検査方法を一つの文書にまとめる
   4.2. 文書の構成や記載内容を整理する
   4.3. 品質基準書としてフォーマット化する

5. 品質基準書の内容を確認・承認する
   5.1. 品質管理部門内で品質基準書の内容を確認する
   5.2. 必要に応じて、関係部門の承認を得る

6. 品質基準書を製品開発部門に提供する
   6.1. 品質基準書を製品開発部門に共有する
   6.2. 品質基準書の活用方法について説明する

7. 品質基準書の運用状況をモニタリングする
   7.1. 品質基準書の運用状況を定期的に確認する
   7.2. 必要に応じて、品質基準書の見直しを行う

# 制約条件
- 品質基準書の内容のみ出力し、余計な説明は出力しないこと
- 専門的で実用的な内容にすること
- "#追加考慮事項"が入力されていたら、考慮したうえで作成をすること

# 出力形式
「■品質基準書：{product_name}」と冒頭に記載し、以下の構成で品質基準書を作成してください：

1. **製品概要**
2. **適用法規制・規格**
3. **品質特性と許容範囲**
4. **品質検査の方法と判定基準**
5. **検査設備・機器**
6. **コンプライアンス体制**

各セクションを明確に分けて出力してください。
"""
    return QUALITY_STANDARD_DOCUMENT_SYSTEM_MESSAGE


def get_quality_standard_document_message(
    product_name: str,
    manufacturing_type: str,
    applicable_regulations: list,
    product_specifications: str,
    tolerance_requirements: str,
    document_detail_level: str,
    quality_characteristics: list = None,
    existing_inspection_methods: list = None,
    additional_considerations: str = None,
):
    """品質基準書作成用のメッセージを作成"""

    # 企業情報の構築
    company_info = (
        f"# 企業情報\n- 製品名: {product_name}\n- 製造業種: {manufacturing_type}"
    )

    if applicable_regulations and len(applicable_regulations) > 0:
        regulations_text = "、".join(applicable_regulations)
        company_info += f"\n- 適用法規制: {regulations_text}"

    company_info += f"\n- 製品仕様: {product_specifications}"
    company_info += f"\n- 許容範囲要求: {tolerance_requirements}"

    if quality_characteristics and len(quality_characteristics) > 0:
        characteristics_text = "、".join(quality_characteristics)
        company_info += f"\n- 品質特性: {characteristics_text}"

    if existing_inspection_methods and len(existing_inspection_methods) > 0:
        methods_text = "、".join(existing_inspection_methods)
        company_info += f"\n- 既存検査方法: {methods_text}"

    # 追加考慮事項
    considerations = ""
    if additional_considerations:
        considerations = f"\n# 追加考慮事項\n{additional_considerations}"

    # 全体メッセージを統合して1つのプロンプトとして作成
    full_prompt = (
        get_quality_standard_document_system_message(
            product_name, manufacturing_type, document_detail_level
        )
        + "\n\n"
        + company_info
        + considerations
    )

    messages = [
        {
            "role": "user",
            "content": full_prompt,
        }
    ]
    return messages

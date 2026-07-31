# 新技術導入提案書の追加依頼
def get_fix_technologyProposal_system_message(result: str) -> str:
    FIX_TECHNOLOGYPROPOSAL_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは、製造業界における新技術導入の専門知識を持つエンジニアです。

    # 目的
    既存の新技術導入提案書をブラッシュアップすること。

    # 指示
    以下の"#流れ"に従って、新技術導入提案書をブラッシュアップしてください。
    ブラッシュアップした新技術導入提案書のみ出力するようにしてください。

    # 流れ
    1. 元の"#新技術導入提案書"を確認する。
    2. "#修正事項"を理解する。
    3. "#修正事項"に基づいて"#新技術導入提案書"をブラッシュアップする。
    4. 修正した新技術導入提案書を出力する。

    # 制約条件
    - ブラッシュアップした新技術導入提案書のみ出力すること。
    - "#修正事項"に従ってブラッシュアップを行うこと。
    - "#提案書"の内容を正確に反映すること。
    - 内容は説得的スタイルかつ専門的なトーンで、プレゼンテーション形式で出力すること。

    # 出力形式
    提案書は、各セクションを見出し付きで整理し、箇条書きや表を用いて視覚的にわかりやすくしてください。

    # 既存の技術導入提案書
    {result}
    """
    return FIX_TECHNOLOGYPROPOSAL_SYSTEM_MESSAGE


def get_fix_technology_proposal_message(
    result: str,
    modify: str,
):
    messages = [
        {
            "role": "system",
            "content": get_fix_technologyProposal_system_message(
                result
            ),
        },
        {"role": "user", "content": f"# 修正事項\n{modify}"},
    ]
    return messages

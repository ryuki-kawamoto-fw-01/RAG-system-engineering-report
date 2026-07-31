# 新技術導入提案書の作成
def get_technologyProposal_system_message(
    technologyName: str,
    market: str,
    current_Issues: str,
    consideration: str,
) -> str:
    TECHNOLOGYPROPOSAL_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは、製造業界における新技術導入の専門知識を持つエンジニアです。

    ### 目的
    製造業界における新技術導入のメリットを明確にし、導入プロセスと期待される成果を具体的に提案すること。
    "{consideration}"があれば、それも加味してください。

    ### 指示
    以下の"#入力欄"をもとに必要な情報を収集し、"#出力形式"に従って経営陣への提案書を作成してください。
    ただし、余計な説明は不要です。

    ### 入力欄
    新技術名：{technologyName}
    市場：{market}
    現状と課題：{current_Issues}
    考慮事項：{consideration}

    ### 流れ
    1. 製造業界のどの市場かを確認し、現状と課題を明確にする。
    2. 新技術の内容（特徴、技術的動向、導入コスト、導入に必要なリソース）を説明する。
    3. 新技術導入のメリットと効果（コスト削減、生産性向上、品質改善、エネルギー効率改善）を示す。
    4. 導入プロセスとリスク管理（導入ステップ、導入スケジュール、導入リスク、導入に関する規制、導入後のモニタリングと評価方法）を提案する。
    5. サポートとコミュニケーション（競合他社の事例、トレーニング計画、導入に関するコミュニケーション計画）を詳述する。

    ### 制約条件
    内容は説得的スタイルかつ専門的なトーンで、プレゼンテーション形式で出力してください。

    ### 出力形式
    提案書は、各セクションを見出し付きで整理し、箇条書きや表を用いて視覚的にわかりやすくしてください。
    """
    return TECHNOLOGYPROPOSAL_SYSTEM_MESSAGE


def get_technologyProposal_message(
    technologyName: str,
    market: str,
    current_Issues: str,
    consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_technologyProposal_system_message(
                technologyName,
                market,
                current_Issues,
                consideration,
            ),
        },
    ]
    return messages

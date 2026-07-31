# リスクアセスメントシートの作成
def get_risk_assessment_system_message(
    workerInfo: str,
    machineInfo: str,
    workerCountAndPlacement: str,
    processDetails: str,
    currentMeasures: str,
) -> str:
    RISKASSESSMENT_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは製造業のリスク対策に関する専門家です。

    ### 目的
    製造業の労働者の安全を確保するため、厚生労働省の基準に基づいた具体的で理解しやすいリスクアセスメントシートを作成すること。

    ### 指示
    以下の"#入力欄"をもとに必要な情報を収集し、#流れに従って現場のリスクを評価し、
    "#出力形式"に従って適切なリスクアセスメントシートを作成してください。
    作成したリスクアセスメントシートのみ出力するようにしてください。
    ただし、余計な説明は不要です。

    ### 入力欄
    労働者情報：{workerInfo}
    使用する機械：{machineInfo}
    作業員の人数と配置：{workerCountAndPlacement}
    工程の詳細：{processDetails}
    現状の対策内容：{currentMeasures}

    ### 流れ
    1. 製造業の現場で働く労働者の情報を収集する。
    2. 使用する機械の種類と特性を明確にする。
    3. 作業員の人数と配置を確認する。
    4. 製造作業工程の詳細を把握する。
    5. 現状の対策内容を評価する。
    6. 以上の情報を基にリスクアセスメントシートを作成する。
    7. 作成したシートを評価基準に基づいてテストし、必要に応じて改善を行う。

    ### 制約条件
    - 厚生労働省のガイドラインに従うこと
    - 表形式で具体的に作成すること
    - 実際の製造現場で使用可能であること
    - 災害防止に貢献すること

    ### 出力形式
    リスクアセスメントシートを表形式で出力し、各項目に対する具体的なリスク評価と対策を記載してください。

    ### 例
    | リスク要因 | リスク評価 | 対策内容 |
    |------------|------------|-----------|
    | 機械の故障 | 高 | 定期点検の実施 |
    | 作業員の不注意 | 中 | 安全教育の実施 |"
    """
    return RISKASSESSMENT_SYSTEM_MESSAGE


def get_risk_assessment_message(
    workerInfo: str,
    machineInfo: str,
    workerCountAndPlacement: str,
    processDetails: str,
    currentMeasures: str,
):
    messages = [
        {
            "role": "user",
            "content": get_risk_assessment_system_message(
                workerInfo,
                machineInfo,
                workerCountAndPlacement,
                processDetails,
                currentMeasures,
            ),
        },
    ]
    return messages

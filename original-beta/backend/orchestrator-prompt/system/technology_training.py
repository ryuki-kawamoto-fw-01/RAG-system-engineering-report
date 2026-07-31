# 技術トレーニング計画
def get_technology_training_system_message(
    technology: str,
    learning_level: str,
    study_time: int,
    consideration: str,
) -> str:
    TECHNOLOGY_TRAINING_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは優秀なエンジニアです。

    ### 目的
    特定の技術に関して学習するトレーニング計画を作成する。

    ### 入力欄
    学習したい技術：{technology}
    学習レベル：{learning_level}
    学習時間：{study_time}
    考慮事項：{consideration}

    ### 指示
    以下の流れに従って、トレーニング計画を作成してください。
    入力欄の情報をもとに作成を進めてください。
    
    ### 制約条件
    - 全体の学習時間の合計が入力欄の学習時間と一致するようにしてください。
    - 学習コンテンツは入力欄の学習レベルに応じたものを選定する。
    - 技術習得において重要なトレーニングについても明示する。
    - 実践的な演習もカリキュラムに取り入れる。

    ### 流れ
    1.学習コンテンツを決める。
    1.1. 入力欄の学習したい技術を習得するために必要な技術情報を収集する。
    1.2. 大項目、中項目、小項目を活用しトレーニングのカリキュラムを組む
    2. 各ステップに必要な学習時間を割り当てる。
    3. 全体の学習時間の合計が入力欄の学習時間と一致するようにする

    ### 出力形式
    - 初めにトレーニングの概要を示す（目的、対象スキル）
    - 各ステップの詳細な学習内容と所要時間を示す
    - 学習コンテンツについて利用する製品や参考資料の情報元も表示する。webリンクは必須。
    - 大項目、中項目、小項目がわかるように文字サイズを変えたり、改行を入れるなどして見やすく表示してください。

    """
    return TECHNOLOGY_TRAINING_SYSTEM_MESSAGE


def get_technology_training_message(
    technology: str,
    learning_level: str,
    study_time: int,
    consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_technology_training_system_message(
                technology,
                learning_level,
                study_time,
                consideration,
            ),
        },
    ]
    return messages

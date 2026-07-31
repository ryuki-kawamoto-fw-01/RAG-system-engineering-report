def get_download_minutes_system_message(minutes: str) -> str:
    DOWNLOAD_MINUTES_SYSTEM_MESSAGE = f"""
    あなたはプロの議事録作成者です。
    以下の"#議事録"をJSON形式に整理してください。
    ただし、余計な説明は不要です。
    # 制約条件
    - 作成した議事録のみ出力すること。
    - 該当する内容がない場合は空とすること。
    - 出力はJSON形式で行うこと。
    - "#議事録"に記載されていない情報は出力しないこと。
    - 議事録の内容は決定事項や宿題事項も分かるように整理すること。
    # 議事録
    {minutes}
    # JSONの内容
    "customer": 顧客名(文字列)、不明の場合は空文字列とする。
    "subject": 議題(文字列)
    "place": 開催場所(文字列)
    "date_time": 会議の日時(文字列)、不明の場合は空文字列とする。
    "participants": 会社名をキー、値はその会社からの参加者名のリストとした辞書のリスト形式。例: [{{"会社A": ["佐藤", "鈴木"]}}, {{"会社B": ["田中"]}}]
    会社名が不明の場合は"所属不明"とする。participantsに限り、参加者の部署が分かっている場合は参加者名の後に括弧で役割を記載する。
    "decision": 決定事項のリスト(文字列のリスト)
    "homework": 宿題事項のリスト。各要素は{{"topic": "宿題内容", "item": {{"deadline": "期限", "responsible": "担当者"}}}}の形式。期限がない場合は「なし」、担当者が不明の場合は「不明」とする。
    "minutes": 議題をキー、値は発言内容のリストとした辞書のリスト形式。発言内容は「（発言者）発言内容」の形式にする。例: [{{"議題1": ["(佐藤)発言内容1", "(鈴木)発言内容2"]}}, {{"議題2": ["(田中)発言内容3"]}}]
    "next_meeting": 次回会議の日時と内容(文字列)、ない場合は「なし」
    """
    return DOWNLOAD_MINUTES_SYSTEM_MESSAGE


def create_download_minutes_system_message(minutes: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": get_download_minutes_system_message(minutes),
        }
    ]

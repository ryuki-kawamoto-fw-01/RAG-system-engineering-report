# 新規メール作成
NEWMAIL_SYSTEM_MESSAGE = """ 
    # 役割
    あなたは優秀なビジネスマンです。

    # 指示
    以下の"#流れ"に従ってstep by stepでメールの件名と本文を作成してください。
    ただし、余計な説明は不要です。

    # 流れ
    1. メールの"#宛先"、"#差出人"を確認する。
    2. "#メールの目的"を確認する。
    3. 記載したい"#メールの内容"を理解する。
    4. その他"#考慮事項"があれば確認する。
    5. 1~4の内容にあったメールの件名を考える。
    6. 1~4の内容にあったメールの本文を考える。
    7. 作成したメールの件名と本文を出力する。

    # 制約条件
    - ビジネスメール特有の記載方法をすること。
    - メールの本文は宛先から記載すること。
    - メールの件名は簡潔で、内容を的確に表現すること。
    - 本文は敬語を使い、丁寧な言葉遣いを心がけること。
    - 受取人に合わせた一貫性のある言葉を使用すること。
    
    # 出力形式
    メールの件名、本文をそれぞれJson形式で出力して下さい。
"""


def get_create_new_mail_message(
    new_mail_to: str,
    new_mail_from: str,
    new_mail_purpose: str,
    new_mail_content: str,
    new_mail_considerations: str,
):
    messages = [
        {"role": "system", "content": NEWMAIL_SYSTEM_MESSAGE},
        {
            "role": "user",
            "content": f"# 宛先\n{new_mail_to}\n# 差出人\n{new_mail_from}\n# メールの目的\n{new_mail_purpose}\n# メールの内容\n{new_mail_content}\n# 考慮事項\n{new_mail_considerations}",
        },
    ]
    return messages

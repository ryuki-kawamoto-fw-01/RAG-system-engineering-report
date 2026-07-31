# 返信メール修正
def get_replymailcorrection_system_message(replymail_body: str) -> str:
    REPLYMAILCORRECTION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なビジネスマンです。

    # 目的
    既存のメールの返信文をブラッシュアップすること。
    
    # 指示
    以下の"#流れ"に従って、メールの返信文をブラッシュアップしてください。
    ブラッシュアップした返信文のみ出力するようにしてください。

    # 流れ
    1. 元のメールの"#返信文"を確認する。
    2. "#修正事項"を理解する。
    3. "#修正事項"に基づいて"#返信文"をブラッシュアップする。
    4. 修正した返信文を出力する。

    # 制約条件
    - ブラッシュアップしたメールの返信文のみ出力すること。
    - "#修正事項"に従ってブラッシュアップを行うこと。
    - ビジネスメール特有の記載方法をすること。
    - メールの本文は宛先から記載すること。
    - 本文は敬語を使い、丁寧な言葉遣いを心がけること。
    - 受取人に合わせた一貫性のある言葉を使用すること。
    
    # 出力形式
    メールの返信文のみ出力して下さい。件名は不要です。

    # 返信文
    {replymail_body}
    """
    return REPLYMAILCORRECTION_SYSTEM_MESSAGE


def get_fix_reply_mail_message(
    created_content: str,
    reply_mail_correction: str,
):

    messages = [
        {
            "role": "system",
            "content": get_replymailcorrection_system_message(created_content),
        },
        {"role": "user", "content": f"# 修正事項\n{reply_mail_correction}"},
    ]
    return messages

def get_summary_message(
    content: str,
    summary_char: int,
    add_prompt: str,
):
    summary_char_minus_30: int = summary_char - 30
    summary_char_plus_30: int = summary_char + 30

    messages = [
        {
            "role": "user",
            "content": f"# 役割\nあなたはユーザから入力されたテキストを約{summary_char}字で要約する優秀なシステムです。\n# 指示\n- 入力されたテキストに対して、要約文のみを返してください。\n# 追加指示\n{add_prompt}\n# 文字数\n下限{summary_char_minus_30}字 上限{summary_char_plus_30}字\n# テキスト\n{content}\n# 手順\n・出力する前に、何文字になったかをカウントしてください。\n・カウントした結果、#文字数 の条件を満たしていることが確認できた場合に限ってタスクを終了してください。\n・カウントした結果、#文字数 の条件を満たしていない場合は、#文字数 の条件を満たせるまで文字を追加したり削除して処理を繰り返してください。",
        }
    ]
    return messages

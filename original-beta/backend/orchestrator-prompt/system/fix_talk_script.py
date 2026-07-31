# トークスクリプト修正
def get_scriptmodification_system_message(talk_script: str) -> str:
    SCRIPTMODIFICATION_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは顧客提案のプロです。

    # 目的
    既存のトークスクリプトをブラッシュアップすること。
    
    # 指示
    以下の"#流れ"に従って、トークスクリプトをブラッシュアップしてください。
    ブラッシュアップしたトークスクリプトのみ出力するようにしてください。

    # 流れ
    1. 元の"#トークスクリプト"を確認する。
    2. "#修正事項"を理解する。
    3. "#修正事項"に基づいて"#トークスクリプト"をブラッシュアップする。
    4. 修正したトークスクリプトを出力する。

    # 制約条件
    - ブラッシュアップしたトークスクリプトのみ出力すること。
    - ビジネスの言い回しとすること。
    - "#修正事項"に従ってブラッシュアップを行うこと。
    - "#提案書"の内容を正確に反映すること。
    - 各ページに対応するトークスクリプトを作成すること。
    - 提案内容に興味を持つようなトークスクリプトを作成すること。
    
    # 出力形式
    各ページごとにトークスクリプトを作成し、ページ番号を明記すること。

    # トークスクリプト
    {talk_script}
    """
    return SCRIPTMODIFICATION_SYSTEM_MESSAGE


def get_fix_talk_script_message(
    talk_script: str,
    talkscript_modification: str,
):
    messages = [
        {
            "role": "system",
            "content": get_scriptmodification_system_message(talk_script),
        },
        {"role": "user", "content": f"# 修正事項\n{talkscript_modification}"},
    ]
    return messages

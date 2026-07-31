# 新規作成
def get_system_message(
    original_text: str,
    type: str,
    consideration: str,
) -> str:
    FLOW_DESIGNER_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは優秀なプロジェクトマネージャーです。
    
    ### 指示
    #入力欄を確認し、以下の#流れに従って、工程管理表を作成してください。余計な説明は不要です。
    
    ### 流れ
    1. ユーザーから製造工程の詳細情報{original_text}を確認し、内容を理解する。
    2. 収集した情報を分析し、製造工程の詳細な手順を特定する。
    3. 工程管理表{type}のテンプレートを準備する。
    4. 詳細な工程情報を基に、テンプレートに自動入力する。
    5. 完成した工程管理表を出力する。
    
    ### 出力形式
    自動生成された工程管理表は以下の項目を含む形式で出力してください。
    1. 工程名
    2. 作業内容
    3. 管理基準
    4. 管理方法
    5. 管理責任者、担当者
    6. 管理頻度
    7. 工程間の依存関係
    8. 異常時処置

    ### 制約条件
    - ユーザー入力に不備がある場合は、該当項目を「不明」と記載する
        例：管理責任者名が不明な場合は「担当部署責任者(不明)」などの汎用表現を用いる
    - 数値や日付、頻度などが不足している場合は、一般的な仮定値を用いて記載し、その旨を項目内に「(仮定)」と明記する
    - 依存関係が不明な場合は「前工程/後工程：不明」とし、判明している範囲のみ記載する
    - 入力形式が不適切な場合でも、解釈可能な範囲で整形し、工程管理表の形式で出力する

    ### 入力欄
    製造工程情報：{original_text}
    作成する工程管理表の種類：{type}
    考慮事項：{consideration}
"""
    return FLOW_DESIGNER_SYSTEM_MESSAGE


def get_user_message(
    original_text: str,
    type: str,
    consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_system_message(
                original_text,
                type,
                consideration,
            ),
        },
    ]
    return messages


# 結果調整
def get_fix_system_message(result: str, revisionPrompt: str) -> str:
    FIX_FLOW_DESIGNER_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀なプロジェクトマネージャーです。

    # 指示
    "{result}"に対して、ユーザから結果調整の依頼があります。
    以下の"#流れ"に従って、結果を調整してください。

    #流れ
    1. "以下#入力欄に示された{result}"を確認し、内容を理解する。
    2. "{revisionPrompt}"を理解する。
    3. "{revisionPrompt}"に基づいて"{result}"をブラッシュアップする。
    4. ブラッシュアップした結果を出力する。

    # 制約条件
    - 調整後の結果のみ出力し、余計な説明は出力しないこと。

    #入力欄
    作成結果：{result}
    結果調整プロンプト：{revisionPrompt}
    """
    return FIX_FLOW_DESIGNER_SYSTEM_MESSAGE


def get_fix_user_message(
    result: str,
    revisionPrompt: str,
):
    messages = [
        {
            "role": "user",
            "content": get_fix_system_message(result, revisionPrompt),
        },
    ]
    return messages

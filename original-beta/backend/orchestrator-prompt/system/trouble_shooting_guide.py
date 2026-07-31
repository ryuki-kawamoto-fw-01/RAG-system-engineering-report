from typing import Dict, List


def get_troubleshooting_guide_system_message(
    productSpecification: str, productName: str, productPurpose: str
) -> str:
    TROUBLE_SHOOTING_SYSTEM_MESSAGE = f"""
    役割
    あなたは長年ヘルプデスクを担当しているエンジニアです。
    ### 目的
    以下の#入力内容をもとにユーザーが製品やシステムの問題解決方法を説明するトラブルシューティングガイドを作成すること。
    ### 指示
    以下の#流れに従って、トラブルシューティングガイドを作成してください。余計な説明は不要です。

    ###入力内容
    製品の仕様：{productSpecification}
    製品名・システム名：{productName}
    製品の目的：{productPurpose}

    ### 流れ
    1. 製品やシステムの一般的な問題点を特定する
    - 過去のサポート記録やユーザーからの問い合わせを分析する
    - 業界の一般的な課題を調査する
    - 製品やシステムの仕様を確認する
    2. 各問題点に対する解決方法を調査する
    - 過去の対応事例を確認する
    - オンラインのナレッジベースを検索する
    3. 問題点と解決方法をわかりやすく整理する
    - 問題点と解決方法のマトリックスを作成する
    - 解決方法の手順を詳細に記述する
    - 必要に応じて図解や画像を追加する
    4. トラブルシューティングガイドの構成を検討する
    - ガイドの目次や構成を検討する
    - 各章の内容や順序を検討する
    - ユーザーにとって使いやすい構成を検討する
    5. ガイドの内容を作成する
    - 問題点と解決方法の情報を整理する
    - ガイドの文章を作成する
    - 必要な図解や画像を作成する
    6. ガイドの完成度を確認する
    - 内容の正確性を確認する
    - 分かりやすさと使いやすさを確認する
    - 必要に応じて修正を行う
    7. ガイドを最終版として完成させて出力する
### 出力形式
トラブルシューティングガイドの各セクションを明確に分けて出力してください。
### 例
・ 一般的な問題点と解決方法
 - 問題: 製品の設定に関する問題
 - 解決方法: 設定手順を確認し、必要な変更を行う
    7. ガイドを最終版として完成させて出力する
    ### 出力形式
    トラブルシューティングガイドの各セクションを明確に分けて出力してください。
    ### 例
    ・ 一般的な問題点と解決方法
    - 問題: 製品の設定に関する問題
    - 解決方法: 設定手順を確認し、必要な変更を行う
    """

    return TROUBLE_SHOOTING_SYSTEM_MESSAGE


def create_trouble_shooting_guide_system_message(
    productSpecification: str, productName: str, productPurpose: str
) -> List[Dict[str, str]]:
    messages = [
        {
            "role": "user",
            "content": get_troubleshooting_guide_system_message(
                productSpecification, productName, productPurpose
            ),
        }
    ]

    return messages

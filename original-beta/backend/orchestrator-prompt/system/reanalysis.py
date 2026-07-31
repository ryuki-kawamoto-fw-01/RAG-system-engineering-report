# 追加分析（画面右下にある「追加で分析する」欄用のプロンプトです）
def get_reanalysis_system_message(
    existing_analysis: str, analytical_method: str
) -> str:
    REANALYSYS_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀な経営コンサルタントです。
    
    # 指示
    あなたにしていただいた"#既存の企業分析"に対して、ユーザから分析の追加依頼があります。
    "#追加依頼"にしたがってさらに企業分析をしてください。

    # 制約条件
    - 分析に関する部分のみ出力し、余計な説明は出力しないこと。

    # 出力形式
    - 分析手法を利用した場合は「■{analytical_method}」と冒頭に記載してから分析結果を出力してください。

    # 既存の企業分析
    {existing_analysis}
    """
    return REANALYSYS_SYSTEM_MESSAGE


def get_reanalysis_message(
    existing_analysis: str, analytical_method: str, reanalysis_request: str
):
    messages = [
        {
            "role": "user",
            "content": get_reanalysis_system_message(
                existing_analysis, analytical_method
            ),
        },
        {"role": "user", "content": f"# 追加依頼\n{reanalysis_request}"},
    ]
    return messages

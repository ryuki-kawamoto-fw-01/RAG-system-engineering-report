# 製品の販促戦略作成
def get_product_promotion_strategy_system_message(
    product_description: str,
    target_market: str,
    differentiation_point: str,
    promotion_tools: str,
    sales_channels: str,
) -> str:
    PROMOTION_STRATEGY_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは優秀なコンサルタントです。
    新製品の販売促進のための戦略を一緒に考えてほしいです。

    ### 指示
    以下#入力欄の情報をもとに、販売促進戦略を出力してください。

    ### 入力欄
    製品説明（製品の特長などを記入）：{product_description}
    主なターゲット市場（顧客層）：{target_market}
    競合との差別化ポイント：{differentiation_point}
    考えている販促ツール：{promotion_tools}
    主な販売チャネル：{sales_channels}

    ### 出力形式
    以下の構成で販売促進戦略を作成してください：
    1. **戦略概要**
    2. **ターゲット分析**
    3. **差別化戦略**
    4. **販促施策の詳細**
    5. **チャネル戦略**
    6. **実行計画とタイムライン**
    7. **成功指標（KPI）**
    8. **予算配分の推奨**

    ### 制約条件
    - 実践的で具体的な提案を行う
    - ROIを意識した効果的な施策を提案
    - 段階的な実施計画を含める
    - 測定可能な成果指標を設定
    """
    return PROMOTION_STRATEGY_SYSTEM_MESSAGE


def get_product_promotion_strategy_message(
    product_description: str,
    target_market: str,
    differentiation_point: str,
    promotion_tools: str,
    sales_channels: str,
):
    messages = [
        {
            "role": "user",
            "content": get_product_promotion_strategy_system_message(
                product_description,
                target_market,
                differentiation_point,
                promotion_tools,
                sales_channels,
            ),
        },
    ]
    return messages

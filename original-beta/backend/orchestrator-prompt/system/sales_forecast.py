# 新規作成
def get_system_message(
    productName: str,
    productCategory: list,
    features: str,
    useCase: str,
    analysisPriorities: list,
    targetIndustry: list,
    targetCustomers: list,
    targetRegions: list,
    marketData: str,
    competingProducts: str,
) -> str:
    SALES_FORECAST_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたはビジネス分析に長けたアナリストであり、非専門家にも分かりやすく説明します。

    ### 目的
    新製品アイデアの販売予測分析を行います。
    この分析は、製品の市場導入前にその成功の可能性を評価するために重要です。

    ### 指示
    以下#入力欄の情報をもとに、
    新製品のアイデアが市場においてどのようなパフォーマンスを示す可能性があるかについて、
    販売予測分析を行い、結果を出力してください。

    ### 入力欄
    新製品名：{productName}
    製品カテゴリ：{', '.join(productCategory)}
    具体的な機能や特徴：{features}
    主な用途：{useCase}
    分析重視ポイント：{', '.join(analysisPriorities)}
    対象業界：{', '.join(targetIndustry)}
    対象顧客層：{', '.join(targetCustomers)}
    対象地域：{', '.join(targetRegions)}
    既に収集している市場データ：{marketData}
    主要競合製品と特徴：{competingProducts}

    ### 制約条件
    - 数字は必ず「保守/ベース/強気」の3シナリオで、単位（万円、百万円、億円、社、％、件/社など）を明記してください。
    - セクションが変わるごとに2行開けて出力。
    - 不確実な前提は「仮置き」と明記し、感度分析で影響を示す
    - 表記ゆれや固有名詞は正確に（例：ISMS認証、SOC 2 Type II）
"""
    return SALES_FORECAST_SYSTEM_MESSAGE


def get_user_message(
    productName,
    productCategory,
    features,
    useCase,
    analysisPriorities,
    targetIndustry,
    targetCustomers,
    targetRegions,
    marketData,
    competingProducts,
):
    messages = [
        {
            "role": "user",
            "content": get_system_message(
                productName,
                productCategory,
                features,
                useCase,
                analysisPriorities,
                targetIndustry,
                targetCustomers,
                targetRegions,
                marketData,
                competingProducts,
            ),
        },
    ]
    return messages


# 結果調整
def get_fix_system_message(result: str, revisionPrompt: str) -> str:
    FIX_SALES_FORECAST_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは優秀なアナリストです。

    ### 指示
    "{result}"に対して、ユーザから結果調整の依頼があります。
    以下の"#流れ"に従って、結果を調整してください。

    ### 流れ
    1. "以下#入力欄に示された{result}"を確認し、内容を理解する。
    2. "{revisionPrompt}"を理解する。
    3. "{revisionPrompt}"に基づいて"{result}"をブラッシュアップする。
    4. ブラッシュアップした結果を出力する。

    ### 制約条件
    - 調整後の結果のみ出力し、余計な説明は出力しないこと。

    ### 入力欄
    作成結果：{result}
    結果調整プロンプト：{revisionPrompt}
    """
    return FIX_SALES_FORECAST_SYSTEM_MESSAGE


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

# 製品のキャッチコピーの作成
def get_catchphrase_system_message(
    product_name: str,
    product_information: str,
    target_customer: str,
    competitor: str,
    consideration: str,
) -> str:
    CATCHPHRASE_SYSTEM_MESSAGE = f"""\
    ### 役割
    あなたは優秀なコピーライターです。

    ### 目的
    商品の特徴やターゲット層をもとに、印象的なキャッチコピーを作成する。

    ### 入力欄
    製品名：{product_name}
    製品情報：{product_information}
    ターゲット顧客：{target_customer}
    競合との比較：{competitor}
    考慮事項：{consideration}

    ### 指示以下の#流れに従って、キャッチコピーを作成してください。
    入力欄の情報をもとに分析し、作成を進めてください。

    ### 流れ 
    1. 商品の特徴を把握する
    1.1. 商品の機能、性能、デザイン、価格などの情報を収集する
    1.2. 商品の強みや魅力的な点を抽出する
    1.3. 商品の差別化要因を明確にする
    2. 商品のターゲット層を特定する
    2.1. 商品が想定しているユーザー層（年齢、性別、収入、ライフスタイルなど）を調査する
    2.2. ターゲット層の嗜好や行動特性を分析する
    2.3. ターゲット層に訴求できる商品の特徴を抽出する
    3. 商品の特徴とターゲット層の情報を基に、印象的な広告コピーのコンセプトを考える
    4. 広告コピーを作成し、ユーザーに提示する

    ### 出力形式
    生成した広告コピーをテキスト形式で提示してください。
    キャッチコピーの案は３つ提示してください。
    また、キャッチコピーの説明や作成意図もそれぞれ２～３行で示してください。見やすいように改行も入れてください。
    キャッチコピーは太字にし、見出しのような感じで説明文より大きく表示してください。

    ### キャッチコピーの例 
    ### 1.「あなたの毎日に、ひとつ上の体験を。」
    【説明】
    日常生活において、ちょっとした贅沢を提供する製品であることを強調しています。ユーザーにとっての「特別な体験」を想起させ、購買意欲を刺激します。

    ### 2.「軽さとパワーを両立。毎日の掃除が、もっと快適に。」
    【説明】
    驚くほど軽いボディに、強力な吸引力を搭載。持ち運びやすく、階段や狭い場所でもスムーズに使える設計で、日々の掃除をストレスなくこなせます。忙しい毎日を支える、頼れる一台です。

    ### 3.「雑音を消して、音だけを残す。静寂の中で、音楽が生きる。」
    【説明】
    騒音を遮断し、純粋な音楽体験を提供する製品であることを強調しています。ユーザーにとっての「静寂の中での音楽」を想起させ、購買意欲を刺激します。
    """
    return CATCHPHRASE_SYSTEM_MESSAGE


def get_catchphrase_message(
    product_name: str,
    product_information: str,
    target_customer: str,
    competitor: str,
    consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_catchphrase_system_message(
                product_name,
                product_information,
                target_customer,
                competitor,
                consideration,
            ),
        },
    ]
    return messages


def get_catchphrase_file_message(
    files_content: str,
    consideration: str,
):
    # ファイル内容を「製品情報」として扱う
    return get_catchphrase_message(
        product_name="（ファイルから抽出）",
        product_information=files_content,
        target_customer="（ファイルから抽出）",
        competitor="（ファイルから抽出）",
        consideration=consideration,
    )

def get_fix_market_report_system_message( 
    result: str,
    prev_market: str,
    prev_competitor: str,
    prev_target: str,
    prev_purpose: str,
    prev_consideration: str,
    market: str,
    competitor: str,
    target: str,
    purpose: str,
    consideration: str,
) -> str:
    FIX_MARKET_REPORT_SYSTEM_MESSAGE = f"""\

    # 役割
    あなたはプロのレポート作成者です。

    # 目的
    既存のレポートをブラッシュアップすること。

    # 指示
    以下の"#流れ"に従って、レポートをブラッシュアップしてください。
    ブラッシュアップされたレポートのみ出力するようにしてください。

    # 1回前の入力値
    調査する市場・分野：{prev_market}
    競合企業：{prev_competitor}
    ターゲット顧客：{prev_target}
    調査の背景・目的：{prev_purpose}
    考慮事項：{prev_consideration}

    # 入力値
    調査する市場・分野：{market}
    競合企業：{competitor}
    ターゲット顧客：{target}
    調査の背景・目的：{purpose}
    考慮事項：{consideration}

    # 流れ
    1. "#1回前の入力値"に基づいて作成された"#レポート"を確認し、内容を理解する。
    2. "#1回前の入力値"と今回の"#入力値"を比較し、修正したい方針を理解する。
    3. "#入力値"に基づいて"#レポート"をブラッシュアップする。
    4. ブラッシュアップしたレポートを出力する。

    # 出力形式
    レポートは以下の内容を日本語で、箇条書きも活用し、見出しや太字なども使って見やすく示してください。マークダウン記法で書いてください。グラフを使う場合は"#グラフの出力形式"に従ってください。
    また冒頭にはタイトルを太字かつ大文字で表示してください。

        タイトル

        1. 市場概要
        {market}の市場規模、成長率、主要プレイヤーについて説明してください。

        2. 競合分析
        市場における{competitor}についてSWOT分析を実施し、結果について
        象限チャートも活用して説明してください。

        3. ターゲット顧客の特性
        {target}の年齢、性別、購買行動についてグラフも活用して説明してください。

        4. 市場トレンドと予測
        市場トレンドの影響と今後の展望について説明してください。
        グラフや図を活用して説明してもかまいません。

        5. 結論と提言
        ビジネス戦略に対する具体的な提言をしてください。

        6.参考文献・情報源
        レポート内で活用した図やグラフの出典を示してください。
        市場トレンドに関して参考になる情報元を示してください。
        競合としてあげた企業ついての情報を提供してください。


        日本語で、箇条書きも活用し、見出しや太字なども使って見やすく示してください。マークダウン記法で書いてください。
        また冒頭にはタイトルを太字かつ大文字で表示してください。

    # グラフ・図の出力形式
    グラフ・図は以下の6種類のみ利用してください。
    使用する内容に応じてグラフ・図を使い分けてください。

    出力する記法は以下に従い、xychart-betaなどの種類やtitle,x-axis,y-axis,lineなどの項目名は変更せず、内容や値の部分のみ変えてください。
    また、xychart-betaを使う場合は何も指定しなければ縦向き、xychart-beta horizontalとすれば横向きなのでグラフによって使い分けてください。
    
    円グラフは作成するグラフに応じて"りんご"などの要素の数を追加してください。
    
    象限チャートは要素は固定でそれぞれの象限内に記載する文字は10文字程度にしてください。
    
    折れ線グラフ
    ```mermaid
    %%{{init:{{'theme':'forest'}}}}%%
    xychart-beta

    title "円相場"
    x-axis "2025年5月" ["12日", "13日", "14日", "15日", "16日"]
    y-axis "(ドル)" 140 --> 150
    line [147.81, 147.95, 146.27, 145.83, 145.36]
    ```

    棒グラフ
    ```mermaid
    %%{{init:{{'theme':'forest'}}}}%%
    xychart-beta

    title "円相場"
    x-axis "2025年5月" ["12日", "13日", "14日", "15日", "16日"]
    y-axis "(ドル)" 140 --> 150
    bar [147.81, 147.95, 146.27, 145.83, 145.36]
    ```

    折れ線グラフと棒グラフの複合
    ```mermaid
    %%{{init:{{'theme':'forest'}}}}%% 
    xychart-beta
        title "Sales Revenue"
        x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    ```

    円グラフ
    ```mermaid
    pie
    title 好きな果物の割合
    "りんご" : 40
    "バナナ" : 30
    "オレンジ" : 20
    "ぶどう" : 10
    ```

    象限チャート
    ```mermaid
    quadrantChart title {{competitor}}のSWOT分析
    x-axis "プラス要因" --> "マイナス要因"
    y-axis "外部環境" --> "内部環境"
    quadrant-1 "Weakness" 
    quadrant-2 "Strength"
    quadrant-3 "Opportunity"
    quadrant-4 "Threat"
    ```

    # レポート
    {result}
    """
    return FIX_MARKET_REPORT_SYSTEM_MESSAGE

def get_fix_report_message(
    result: str,
    prev_market: str,
    prev_competitor: str,
    prev_target: str,
    prev_purpose: str,
    prev_consideration: str,
    market: str,
    competitor: str,
    target: str,
    purpose: str,
    consideration: str,
):
    messages = [
        {
            "role": "system",
            "content": get_fix_market_report_system_message(
                result, prev_market, prev_competitor, prev_target, prev_purpose, prev_consideration, market, competitor, target, purpose, consideration
            ),
        },
    ]
    return messages

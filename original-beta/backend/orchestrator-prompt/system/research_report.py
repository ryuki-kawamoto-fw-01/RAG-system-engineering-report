# 研究報告書
def get_research_report_system_message(
    subject: str,
    purpose: str,
    method: str,
    researchresult: str,
    references: str,
    consideration: str,
) -> str:
    RESEARCH_REPORT_SYSTEM_MESSAGE = f"""\
    # 役割
    あなたは優秀な研究者です。

    # 目的
    研究報告書の草案を作成します。

    # 指示
    以下の情報をもとに、日本語で研究報告書を"#流れ"に従って作成してください。
    箇条書きも活用し、見出しや太字なども使って見やすく示してください。マークダウン記法で書いてください。グラフを使う場合は"#グラフの出力形式"に従ってください。
    また、主題や冒頭にはタイトルを太字かつ大文字で日本語で表示してください。
    "{consideration}"があれば、それも加味してください。
    - テーマ: {subject}
    - 目的: {purpose}
    - 研究方法: {method}
    - 結果: {researchresult}
    - 参考文献: {references}

    # 流れ
    1.研究の目的を
        1.1. 研究の背景と動機
        1.2. 研究の目的
        1.3. 研究の仮説
    2.研究方法
        2.1. 実験や調査の手順
        2.2. 使用した機器や分析手法
        2.3. データ収集と分析の方法
    3.研究結果
        3.1. 得られたデータや分析結果
        3.2. 図表や画像
        3.3. 結果の解釈と意味
    4.研究の考察と結論
        4.1. 研究結果の意義と限界
        4.2. 研究の仮説に対する検証結果
        4.3. 今後の課題や展望
    5.参考文献
        5.1. 引用文献
        5.2. 参考にした文献情報

    # 制約条件
    - 研究報告書に関する部分のみ出力し、余計な説明は出力しないこと。

    # グラフの出力形式
    グラフ・図は以下の6種類のみ利用してください。
    使用する内容に応じてグラフ・図を使い分けてください。

    出力する記法は以下に従い、xychart-betaなどの種類やtitle,x-axis,y-axis,lineなどの項目名は変更せず、内容や値の部分のみ変えてください。
    また、xychart-betaを使う場合は何も指定しなければ縦向き、
    xychart-beta horizontalとすれば横向きなのでグラフによって使い分けてください。
    
    円グラフは作成するグラフに応じて"りんご"などの要素の数を追加してください。
    
    タイムラインも2002などの年を記すものの数や、Googleなど紐づく要素の数も作成する図に応じて追加してください。
    また、タイムラインについて内容の各要素は20文字以内にしてください。1行は10文字以内になるようにし、超える場合は
    単語の区切りがいい箇所で半角スペースを入れてください。半角、全角に関わらず1文字とカウントしてください。
    
    象限チャートは象限内に配置する要素の数や位置は作成する図に応じて変更・追加してください。
    
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
        x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct]
        y-axis "Revenue (in $)" 4000 --> 11000
        bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500]
        line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500]
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

    タイムライン
    ```mermaid
    timeline
        title ソーシャルメディアプラットフォームの歴史
        2002 : LinkedIn
        2004 : Facebook : Google
        2005 : Youtube
        2006 : Twitter
    ```

    象限チャート
    ```mermaid
    quadrantChart title 地球温暖化を止めるための取り組み
    x-axis "短期で取り組む" --> "長期で取り組む"
    y-axis "個人でできる" --> "社会で取り組む"
    quadrant-1 "社会の長期的な取り組み"
    quadrant-2 "社会の短期的な取り組み"
    quadrant-3 "個人の短期的な取り組み"
    quadrant-4 "個人の長期的な取り組み"
    "太陽光発電を増やす": [0.3, 0.6]
    "移動を徒歩、公共交通に": [0.45, 0.23]
    "水素エネルギー利用促進、二酸化炭素回収": [0.57, 0.69]
    "低環境負荷製品を選ぶ": [0.78, 0.34]
    "照明のLED化": [0.40, 0.34]
    "環境規制の強化": [0.35, 0.78]
    ```

    """
    return RESEARCH_REPORT_SYSTEM_MESSAGE


def get_research_report_message(
    subject: str,
    purpose: str,
    method: str,
    researchresult: str,
    references: str,
    consideration: str,
):
    messages = [
        {
            "role": "user",
            "content": get_research_report_system_message(
                subject,
                purpose,
                method,
                researchresult,
                references,
                consideration,
            ),
        },
    ]
    return messages

from modules.utils import get_current_date_time

output_format = """# Output Format

出力は以下のJSON形式で行ってください：

{
  "summary": "選択された結果の全体的な関連性と有用性についての簡潔な要約",
  "rankedResults": [
    {
      "title": str, #選択された検索結果のタイトル
      "url": str, #選択された検索結果のURL
      "snippet": str, #選択された検索結果の抜粋
      "reason": str, #この結果を選んだ理由の簡潔な説明
      "score": int, #検索結果のスコア（1-5）
      "rank": int, #検索結果のランク（1-3）
    }...
  ],
}
"""

"""
# Examples

入力:
質問: "人工知能の倫理的影響とは何ですか？"
検索結果:
[{
  "title": "AIの倫理：人工知能が社会に与える影響",
  "url": "https://example.com/ai-ethics",
  "snippet": "人工知能の発展に伴い、プライバー、雇用、意思決定の公平性など、様々な倫理的課題が浮上しています。"
},
{
  "title": "最新のAI技術：機械学習アルゴリズムの進化",
  "url": "https://example.com/ai-tech-advancements",
  "snippet": "ディープラーニングや強化学習など、最新のAI技術の進歩について詳しく解説します。"
},
{
  "title": "AI倫理に関する国際的な取り組み",
  "url": "https://example.com/global-ai-ethics",
  "snippet": "各国政府やテクノロジー企業が、AIの倫理的使用に関するガイドラインを策定しています。"
}]

出力:
{
  "summary": "選択された結果は、AIの倫理的影響の具体例、国際的な対応、技術の進歩という観点から質問に答えています。特に上位2つの結果は、AIの倫理的課題とその対応策に焦点を当てており、質問に対して有用な情報を提供しています。",
  "rankedResults": [
    {
      "title": "AIの倫理：人工知能が社会に与える影響",
      "url": "https://example.com/ai-ethics",
      "snippet": "人工知能の発展に伴い、プライバシー、雇用、意思決定の公平性など、様々な倫理的課題が浮上しています。",
      "reason": "この結果は質問に直接答えており、AIの倫理的影響の具体例を提供しているため、最も関連性が高いと判断しました。"
      "score": 5,
      "rank": 1,
    },
    {
      "title": "AI倫理に関する国際的な取り組み",
      "url": "https://example.com/global-ai-ethics",
      "snippet": "各国政府やテクノロジー企業が、AIの倫理的使用に関するガイドラインを策定しています。",
      "reason": "AIの倫理的影響に対する具体的な対応策を示しており、質問に関連する重要な情報を提供しています。"
      "score": 4,
      "rank": 2,
    },
    {
      "title": "最新のAI技術：機械学習アルゴリズムの進化",
      "url": "https://example.com/ai-tech-advancements",
      "snippet": "ディープラーニングや強化学習など、最新のAI技術の進歩について詳しく解説します。",
      "reason": "AI技術の進歴的影響に直接言及していないため、関連性は低めです。"
      "score": 2,
      "rank": 3,
    }
  ],
}
"""


def create_rerank_search_results_prompt(
    question: str, context_info: str, search_results: str
) -> str:
    # ここにリランキングのロジックを実装します
    # OpenAI APIを使用してプロンプトを送信し、結果を解析する処理を追加します
    if len(search_results) == 0 or len(question) == 0:
        raise ValueError("Invalid input")
    RERANK_PROMPT = f"""あなたは検索結果のランキングを行うエキスパートです。
    
ユーザーの質問から意図を汲み取り、与えられた検索結果から質問に最も関連性の高い検索結果を選択し、ランク付けしてください。各検索結果の関連性、信頼性、情報の新しさを考慮し、質問に対する回答を提供するのに最も役立つ結果を特定してください。

# 入力データ
1. 質問: {question}
2. 情報タイプと予想される取得情報の種類:
**コンテキスト情報**: ユーザーの質問や対話履歴に基づいて取得された関連する情報を示します。
{context_info}
3. 検索結果:
{search_results}
4. 現在の日時: {get_current_date_time()}


# Steps

1. 与えられた質問を注意深く読み、主要なキーワードと概念を特定します。
2. 各検索結果を以下の基準で評価します：
   - 関連性：質問のトピックや意図にどれだけ合致しているか
   - 信頼性：情報源の信頼性や評判
   - 情報の新しさ：データが最新のものかどうか(現在の日時: {get_current_date_time()})
3. 各検索結果に1から5のスコアを付けます（5が最高）。
4. スコアに基づいて検索結果をランク付けし、上位5つを選択します。
5. 選択した結果について、なぜそれらが質問に対して最も関連性が高いと判断したかを簡潔に説明します。

{output_format}

# Notes

- 検索結果が5つ未満の場合は、利用可能な結果のみをランク付けしてください。
- スコアは相対的なものであり、必ずしも最高スコアが5である必要はありません。質問との関連性に応じて適切にスコアを付けてください。
- 選択された結果が質問に十分に答えていない場合は、summaryでその旨を言及し、追加の情報が必要かもしれないことを示唆してください。"""
    return RERANK_PROMPT

from modules.contextualize.utils import convert_chat_history_to_string


def get_contextualize_query_prompt(context, user_question: str) -> str:
    return f"""
チャット履歴と質問から独立した検索用質問を作成する手順

# 入力
- チャット履歴: 
{convert_chat_history_to_string(context)}
- 最新質問: 「{user_question}」

# 質問再構築手順
1. 意図の明確化
- 求める情報の種類の特定
- 対象文書種別の確認

2. 質問の最適化
- 重要キーワードを文頭配置
- 不要語句の削除
- 全体情報から詳細情報への順序化

# 出力形式
<user_intention>
abstract_intention:
- 情報要求の全体目的
- 必要情報の明確化

specific_subgoals:
- サブ目的リスト
</user_intention>

<reformulated_query>
- キーワード優先の文章構成
- 検索最適化された質問形式
- 全体から詳細への構造化
</reformulated_query>
    """


def get_contextualize_q_user_long_prompt(context, user_question: str) -> str:
    return f"""以下のチャット履歴とユーザーの最新の質問を考慮し、チャット履歴がなくても理解できる独立した質問を作成してください。

# 入力データ
- **チャット履歴**（文脈の参考用）:
{convert_chat_history_to_string(context)}

- **ユーザーの最新の質問**:
「{user_question}」

# 質問の再構築プロセス
## 1. ユーザーの意図を明確化
以下の要素を抽出し、検索に適した形式に変換する。
- **情報の種類**  
  ユーザーが求める情報がどれに該当するか特定する。
- **文書の種類**  
  必要な情報がどの種類の文書（プロジェクト報告書、ガントチャート、会議議事録、工程管理表）に記載されているかを明確にする。

## 2. 質問の書き換え
1. **キーワードを文章の先頭に配置する**
   - 重要なエンティティ（プロジェクト名、工程名、文書種別など）を文章の冒頭に配置し、検索システムが最も関連性の高い情報を抽出できるようにする。

2. **検索向けに不要な語句を削除し、簡潔な形式にする**
   - 「その工程」「具体的な」などの曖昧な表現を削除し、検索精度を向上させる。

3. **広い視野の情報を先に、詳細情報を後に配置する**
   - ユーザーの質問の意図を大きな枠組みで整理し、プロジェクト全体のスケジュールや工程情報を先に述べ、詳細な内容を後に配置する。

## **3. 出力フォーマット**
以下のフォーマットで出力する。

<user_intention>
abstract_intention:
  - ユーザーが求める情報の全体的な目的を記述する。
  - どのような情報が必要で、何を知りたいのかを明確にする。

specific_subgoals:
- ユーザーが求める情報のサブ目的を記述する
</user_intention>

<reformulated_query>
-  重要なキーワードを文章の先頭に配置し、主要なエンティティ（プロジェクト名、工程名、文書種別など）を明示する。
- ユーザーの求める情報を検索しやすい形式に変換し、文脈を整理する。
- 広い視野の情報を最初に示し、詳細情報を後に続ける形で文章を構成する。
- 検索システムが処理しやすいように不要な語句を削除し、簡潔な文章にする。
</reformulated_query>"""

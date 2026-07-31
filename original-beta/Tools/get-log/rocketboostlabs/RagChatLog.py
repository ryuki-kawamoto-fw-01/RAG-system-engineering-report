# 文書検索画面ログ取得ツール
# pip installでtk、pandas、azure-cosmos xlsxwriter python-dotenvをインストールしてから実行してください。
import os
from datetime import datetime
from tkinter import Tk
from tkinter.filedialog import asksaveasfilename

import pandas as pd
from azure.cosmos import CosmosClient
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()
# Azure Cosmos DBの接続情報を環境変数から取得
uri = os.getenv("URI")
database_key = os.getenv("DATABASE_KEY")
database_name = os.getenv("DATABASE_NAME")

# メイン処理
print("Azure Cosmos DBから文書検索画面のログを取得してExcelファイルに出力します。")

# Azure Cosmos DBへの接続設定
cosmos_client = CosmosClient(uri, credential=database_key)
database = cosmos_client.get_database_client(database_name)

# threadとmessageというコンテナーを取得
container_thread_rag = database.get_container_client("thread-rag")
container_message_rag = database.get_container_client("message-rag")

# 会話リストを定義
conversation_list = []

# threadのクエリを作成
query1 = "SELECT c.id, c.title, c.deletedAt , c.userId , c.userEmail , c.userName FROM c"
# クエリを実行して結果をリストとして取得。
query_items = list(container_thread_rag.query_items(query1, enable_cross_partition_query=True))

for item in query_items:

    # threadコンテナのidとmessageコンテナのthreadIdを結合して、messageコンテナのクエリを作成
    query2 = f"SELECT * FROM c WHERE c.threadId = '{item['id']}'"
    # messageコンテナに対してクエリを実行
    messages = list(container_message_rag.query_items(query2, enable_cross_partition_query=True))

    # messagesリストが空の場合、conversation_dataに空文字で追加
    if len(messages) == 0:
        conversation_data = {
            "スレッドID": item.get("id", ""),
            "タイトル": item.get("title", "").replace("\n", " ").replace("\r", " "),
            "削除日時": item.get("deletedAt", ""),
            "メッセージID": "",
            "ロール": "",
            "メッセージ内容": "",
            "作成日時": "",
            "モデル": "",
            "ユーザーID": item.get("userId", ""),
            "ユーザーEmail": item.get("userEmail", ""),
            "ユーザー名": item.get("userName", ""),
            "検索方法": "",
            "検索処理時間": "",
            "引用元情報": "",
            "チャット処理時間": "",
            "入力トークン": "",
            "出力トークン": "",
            "埋込トークン": "",
            "フィードバック結果": "",
            "理由１": "",
            "理由２": "",
            "理由３": "",
            "理由４": "",
            "理由５": "",
            "理由６": "",
            "フィードバックテキスト(任意)": "",
            "フィードバック日時": "",
        }
        conversation_list.append(conversation_data)

    else:
        # messageリストの要素分だけループ
        for message in messages:
            # 取得したthreadとmessageのデータを整形してリストに追加。指定したキーが存在しない場合は空文字を返す。
            conversation_data = {
                "スレッドID": item.get("id", ""),
                "タイトル": item.get("title", "").replace("\n", " ").replace("\r", " "),
                "削除日時": item.get("deletedAt", ""),
                "メッセージID": message.get("id", ""),
                "ロール": message.get("role", ""),
                "メッセージ内容": message.get("content", "").replace("\n", " ").replace("\r", " "),
                "作成日時": message.get("createdAt", ""),
                "モデル": message.get("model", ""),
                "ユーザーID": item.get("userId", ""),
                "ユーザーEmail": item.get("userEmail", ""),
                "ユーザー名": item.get("userName", ""),
                "検索方法": message.get("searchMethod", ""),
                "検索処理時間": message.get("searchProcessingTime", ""),
                "引用元情報": message.get("citation", ""),
                "チャット処理時間": message.get("chatProcessingTime", ""),
                "入力トークン": message.get("inputTokens", ""),
                "出力トークン": message.get("outputTokens", ""),
                "埋込トークン": message.get("userContentEmbeddingTokens", ""),
                "フィードバック結果": message.get("feedbackType", ""),
                "理由１": message.get("feedbackOption1", ""),
                "理由２": message.get("feedbackOption2", ""),
                "理由３": message.get("feedbackOption3", ""),
                "理由４": message.get("feedbackOption4", ""),
                "理由５": message.get("feedbackOption5", ""),
                "理由６": message.get("feedbackOption6", ""),
                "フィードバックテキスト(任意)": message.get("feedbackText", ""),
                "フィードバック日時": message.get("feedbackAt", ""),
            }
            conversation_list.append(conversation_data)

# conversation_listをExcelファイルに出力。保存場所はユーザが指定。
print("ファイルを保存する場所を選択してください。")
root = Tk()
root.withdraw()

# 現在の日時を取得して指定の形式でファイル名を生成
current_time = datetime.now().strftime("%Y%m%d%H%M")
default_filename = f"RagChatLog_{current_time}.xlsx"

save_path = asksaveasfilename(
    defaultextension=".xlsx", initialfile=default_filename, filetypes=[("Excel file", "*.xlsx")]
)

df = pd.DataFrame(conversation_list)
df.to_excel(save_path, index=False, sheet_name="RagChatLog", engine="xlsxwriter")
print(f"Excelファイルを{save_path}に出力しました。")

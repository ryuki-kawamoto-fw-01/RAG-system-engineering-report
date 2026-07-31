import pandas as pd
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

def get_rag_log_df(uri, database_name, start_iso, end_iso):
    credential = DefaultAzureCredential()
    cosmos_client = CosmosClient(uri, credential=credential)
    database = cosmos_client.get_database_client(database_name)
    container_thread_rag = database.get_container_client("thread-rag")
    container_message_rag = database.get_container_client("message-rag")

    conversation_list = []
    query1_rag = "SELECT c.id, c.title, c.deletedAt , c.userId , c.userEmail , c.userName FROM c"
    query_items_rag = list(container_thread_rag.query_items(query1_rag, enable_cross_partition_query=True))

    for item in query_items_rag:
        where_clauses_rag = [f"c.threadId = '{item['id']}'"]
        if start_iso:
            where_clauses_rag.append(f"c.createdAt >= '{start_iso}'")
        if end_iso:
            where_clauses_rag.append(f"c.createdAt <= '{end_iso}'")
        where_str_rag = " AND ".join(where_clauses_rag)
        query2_rag = f"SELECT * FROM c WHERE {where_str_rag}"

        messages = list(container_message_rag.query_items(query2_rag, enable_cross_partition_query=True))
        if len(messages) == 0:
            continue

        for message in messages:
            conversation_data = {
                "スレッドID": item.get("id", ""),
                "タイトル": (item.get("title") or "").replace("\n", " ").replace("\r", " "),
                "削除日時": item.get("deletedAt", ""),
                "メッセージID": message.get("id", ""),
                "ロール": message.get("role", ""),
                "メッセージ内容": (message.get("content", "") or "").replace("\n", " ").replace("\r", " "),
                "作成日時": message.get("createdAt", ""),
                "モデル": message.get("model", ""),
                "ユーザーID": item.get("userId", ""),
                "ユーザーEmail": item.get("userEmail", ""),
                "ユーザー名": item.get("userName", ""),
                "部署": message.get("userDepartmentName", ""),
                "検索方法": message.get("searchMethod", ""),
                "検索インデックス": message.get("selectedIndex", ""),
                "コンテンツクエリ時間": message.get("contextualizedQueryTime", ""),
                "辞書処理時間": message.get("dictionaryProcessingTime", ""),
                "検索処理時間": message.get("searchProcessingTime", ""),
                "埋め込み時間": message.get("embeddingTime", ""),
                "QA検索時間": message.get("qaSearchTime", ""),
                "文書検索時間": message.get("documentSearchTime", ""),
                "総合検索時間": message.get("totalSearchTime", ""),
                "回答生成時間": message.get("answerGenerationTime", ""),
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

    df = pd.DataFrame(conversation_list)
    return df

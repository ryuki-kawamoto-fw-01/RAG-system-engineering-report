import pandas as pd
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential


def get_thread_df(uri, database_name, start_iso, end_iso):
    """
    thread コンテナのみを対象に、updatedAt の期間で抽出し、
    以下のカラムで DataFrame を返す:
      作成日時, ユーザーID, ユーザー名, 部署, モデル, 入力トークン, 出力トークン, 合計トークン
    """
    credential = DefaultAzureCredential()
    cosmos_client = CosmosClient(uri, credential=credential)
    database = cosmos_client.get_database_client(database_name)
    container_thread = database.get_container_client("thread")

    records = []

    # thread.updatedAt で期間フィルタ
    where_clauses = []
    if start_iso:
        where_clauses.append(f"c.updatedAt >= '{start_iso}'")
    if end_iso:
        where_clauses.append(f"c.updatedAt <= '{end_iso}'")
    query = "SELECT * FROM c"
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    items = list(container_thread.query_items(query, enable_cross_partition_query=True))
    if not items:
        return pd.DataFrame(records)

    for item in items:
        record = {
            "作成日時": item.get("updatedAt", item.get("createdAt", "")),
            "ユーザーID": item.get("userId", ""),
            "ユーザー名": item.get("userName", ""),
            "部署": item.get("userDepartmentName", ""),
            "モデル": item.get("model", ""),
            "入力トークン": item.get("titleInputToken"),
            "出力トークン": item.get("titleOutputToken"),
        }
        records.append(record)

    return pd.DataFrame(records)

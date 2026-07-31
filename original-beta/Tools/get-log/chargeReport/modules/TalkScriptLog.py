import pandas as pd
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
import json

def _as_dict(value):
    """
    item["log"] が dict のほか、文字列(JSON文字列)で入っているケースにも対応。
    それ以外は空dictを返す。
    """
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return {}
    return {}

def get_talk_script_df(uri, database_name, start_iso, end_iso):
    credential = DefaultAzureCredential()
    cosmos_client = CosmosClient(uri, credential=credential)
    database = cosmos_client.get_database_client(database_name)
    container = database.get_container_client("talk-script")

    where_clauses = []
    if start_iso:
        where_clauses.append(f"c.createdAt >= '{start_iso}'")
    if end_iso:
        where_clauses.append(f"c.createdAt <= '{end_iso}'")

    query = "SELECT * FROM c"
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    items = list(container.query_items(query, enable_cross_partition_query=True))

    records = []
    for item in items:
        # log の安全な取り出し（dict or JSON文字列に対応）
        log = _as_dict(item.get("log", {}))
        model = log.get("model","")
        input_token = log.get("inputToken")
        output_token = log.get("outputToken")

        rec = {
            "ユーザーID": item.get("userId", ""),
            "ユーザーEmail": item.get("userEmail", ""),
            "ユーザー名": item.get("userName", ""),
            "ユーザー部署": item.get("userDepartmentName", ""),
            "作成日時": item.get("createdAt", ""),
            "モデル": model,
            "入力トークン": input_token,
            "出力トークン": output_token,
        }
        records.append(rec)

    df = pd.DataFrame(records)
    return df
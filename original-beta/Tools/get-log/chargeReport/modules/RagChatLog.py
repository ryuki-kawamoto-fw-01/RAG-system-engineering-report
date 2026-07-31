import json
import pandas as pd
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential

def _as_dict(value):
    """dict か JSON文字列なら dict にして返す。それ以外は {}"""
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return {}
    return {}

def get_rag_log_df(uri, database_name, start_iso, end_iso):
    credential = DefaultAzureCredential()
    cosmos_client = CosmosClient(uri, credential=credential)
    database = cosmos_client.get_database_client(database_name)
    container_message = database.get_container_client("message-rag")

    conversation_list = []

    # message の createdAt のみで期間フィルタ
    where_clauses = []
    if start_iso:
        where_clauses.append(f"c.createdAt >= '{start_iso}'")
    if end_iso:
        where_clauses.append(f"c.createdAt <= '{end_iso}'")
    where_str = " AND ".join(where_clauses)
    query = f"SELECT * FROM c" if not where_str else f"SELECT * FROM c WHERE {where_str}"

    messages = list(container_message.query_items(query, enable_cross_partition_query=True))
    if len(messages) == 0:
        return pd.DataFrame(conversation_list)

    for message in messages:
        # log（入れ子 JSON）の安全な取り出し
        log = _as_dict(message.get("log", {}))
        context = _as_dict(log.get("contextLog", {}))
        token_usage = _as_dict(context.get("token_usage", {}))

        # モデル名は context.llm_type 優先、なければ message.model や log.model をフォールバック
        model = context.get("llm_type") or message.get("model") or log.get("model") or ""

        in_tok = token_usage.get("prompt_tokens") or message.get("inputTokens")
        out_tok = token_usage.get("completion_tokens") or message.get("outputTokens")

        conversation_data = {
            "作成日時": message.get("createdAt", ""),
            "ユーザーID": message.get("userId", ""),
            "ユーザーEmail": message.get("userEmail", ""),
            "ユーザー名": message.get("userName", ""),
            "部署": message.get("userDepartmentName", ""),
            "モデル": model,
            "入力トークン": in_tok,
            "出力トークン": out_tok,
        }
        conversation_list.append(conversation_data)

    df = pd.DataFrame(conversation_list)
    return df

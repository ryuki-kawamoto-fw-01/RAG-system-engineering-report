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

def get_create_mail_df(uri, database_name, start_iso, end_iso):
    credential = DefaultAzureCredential()
    cosmos_client = CosmosClient(uri, credential=credential)
    database = cosmos_client.get_database_client(database_name)
    container = database.get_container_client("create-mail")

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
        model = log.get("model")
        input_token = log.get("inputToken")
        output_token = log.get("outputToken")
        response_time = log.get("responseTime")

        rec = {
            "ユーザーID": item.get("userId", ""),
            "ユーザーEmail": item.get("userEmail", ""),
            # COSMOS DBだと"useName"になっているため、カラム名を変更
            "ユーザー名": item.get("useName", ""),
            "ユーザー部署": item.get("userDepartmentName", ""),
            "作成日時": item.get("createdAt", ""),
            "モード": item.get("mode", ""),
            "タイプ": item.get("type", ""),
            "受信したメール": item.get("reception", ""),
            "宛先": item.get("mailTo", ""),
            "差出人": item.get("mailFrom", ""),
            "メール目的": item.get("mailPurpose", ""),
            "メール内容": item.get("mailContent", ""),
            "考慮事項": item.get("mailConsiderations", ""),
            "出力項目": item.get("outputForm", ""),
            "フィードバック結果": item.get("feedbackType", ""),
            "理由１": item.get("feedbackOption1", ""),
            "理由２": item.get("feedbackOption2", ""),
            "理由３": item.get("feedbackOption3", ""),
            "理由４": item.get("feedbackOption4", ""),
            "理由５": item.get("feedbackOption5", ""),
            "理由６": item.get("feedbackOption6", ""),
            "フィードバックテキスト(任意)": item.get("feedbackText", ""),
            "フィードバック日時": item.get("feedbackAt", ""),
            "モデル": model if model is not None else "",
            "入力トークン": input_token, 
            "出力トークン": output_token,
            "レスポンスタイム(秒)": response_time,
        }
        records.append(rec)

    df = pd.DataFrame(records)
    return df

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


def _as_list(value):
    """list 以外は空リストに正規化"""
    return value if isinstance(value, list) else []


def get_chat_log_df(uri, database_name, start_iso, end_iso):
    credential = DefaultAzureCredential()
    cosmos_client = CosmosClient(uri, credential=credential)
    database = cosmos_client.get_database_client(database_name)
    container_thread = database.get_container_client("thread")
    container_message = database.get_container_client("message")

    conversation_list = []
    query1 = (
        "SELECT c.id, c.title, c.deletedAt , c.userId , c.userEmail , c.userName , "
        "c.titleResponseTime, c.titleInputToken , c.titleOutputToken FROM c"
    )
    query_items = list(container_thread.query_items(query1, enable_cross_partition_query=True))

    for item in query_items:
        where_clauses = [f"c.threadId = '{item['id']}'"]
        if start_iso:
            where_clauses.append(f"c.createdAt >= '{start_iso}'")
        if end_iso:
            where_clauses.append(f"c.createdAt <= '{end_iso}'")
        where_str = " AND ".join(where_clauses)
        query2 = f"SELECT * FROM c WHERE {where_str}"

        messages = list(container_message.query_items(query2, enable_cross_partition_query=True))
        if len(messages) == 0:
            continue

        for message in messages:
            # log（入れ子 JSON）の安全な取り出し
            log = _as_dict(message.get("log", {}))
            context = _as_dict(log.get("contextLog", {}))
            trace = _as_dict(log.get("traceLog", {}))

            token_usage = _as_dict(context.get("token_usage", {}))
            input_value = _as_dict(context.get("input_value", {}))

            tags_list = _as_list(context.get("tags", []))
            tags_str = ", ".join(map(str, tags_list)) if tags_list else ""

            # 入力値は可読性のため JSON 文字列化（空なら空文字）
            args_json = ""
            kwargs_json = ""
            try:
                args_val = input_value.get("args", [])
                if args_val:
                    args_json = json.dumps(args_val, ensure_ascii=False)
            except Exception:
                pass
            try:
                kwargs_val = input_value.get("kwargs", {})
                if kwargs_val:
                    kwargs_json = json.dumps(kwargs_val, ensure_ascii=False)
            except Exception:
                pass

            conversation_data = {
                "スレッドID": item.get("id", ""),
                "タイトル": (item.get("title") or "").replace("\n", " ").replace("\r", " "),
                "タイトル生成時間": item.get("titleResponseTime", ""),
                "タイトル入力トークン": item.get("titleInputToken", ""),
                "タイトル出力トークン": item.get("titleOutputToken", ""),
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
                "画像URL": message.get("imageUrl", ""),
                "webSearch": message.get("webSearch", ""),
                "Web検索結果": message.get("searchResults", ""),
                "チャット処理時間": message.get("chatProcessingTime", ""),
                "入力トークン": message.get("inputTokens", ""),
                "出力トークン": message.get("outputTokens", ""),
                "レスポンス時間": message.get("responseTime", ""),
                "フィードバック結果": message.get("feedbackType", ""),
                "理由１": message.get("feedbackOption1", ""),
                "理由２": message.get("feedbackOption2", ""),
                "理由３": message.get("feedbackOption3", ""),
                "理由４": message.get("feedbackOption4", ""),
                "理由５": message.get("feedbackOption5", ""),
                "理由６": message.get("feedbackOption6", ""),
                "フィードバックテキスト(任意)": message.get("feedbackText", ""),
                "フィードバック日時": message.get("feedbackAt", ""),
                # 追加: message.log 配下
                "ログ.ログID": log.get("logId", ""),
                "ログ.トレースID": trace.get("trace_id", ""),
                "ログ.LLM名": context.get("llm_name", ""),
                "ログ.LLMタイプ": context.get("llm_type", ""),
                "ログ.関数名": context.get("function_name", ""),
                "ログ.タグ": tags_str,
                "ログ.入力タイプ": context.get("input_type", ""),
                "ログ.出力タイプ": context.get("output_type", ""),
                "ログ.入力値_args": args_json,
                "ログ.入力値_kwargs": kwargs_json,
                "ログ.プロンプトトークン": token_usage.get("prompt_tokens"),
                "ログ.完了トークン": token_usage.get("completion_tokens"),
                "ログ.合計トークン": token_usage.get("total_tokens"),
                "ログ.成功": context.get("successful"),
                "ログ.遅延時間(秒)": context.get("delay_time"),
            }
            conversation_list.append(conversation_data)

    df = pd.DataFrame(conversation_list)
    return df

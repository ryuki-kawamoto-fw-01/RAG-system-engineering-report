import base64
import json
import logging
import os
import time
from typing import Optional, Union

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobClient, BlobServiceClient

from interceptor.rag_chat import rag_chat_error_handler
from modules.common import create_tempfile_container_client
from modules.contextualize_chat import gen_contextualized_query
from modules.dictionary_methods import dictionary_registration

# from modules.error_handler import azure_function_error_handler, error_handler
from modules.file_prompt import get_file_content
from modules.rag import completion_rag_with_ref
from modules.recommend import generate_recommend
from modules.title import generate_thread_title

# 許可されたモデルのリスト
ALLOWED_MODELS = ["gpt-5.2", "gpt-5.2-reasoning", "gpt-4.1"]
ALLOWED_SEARCH_METHODS = [
    "semantic-hybrid-search",
    "keyword-search",
    "agentic-retrieval",
]

system_message_ref = os.environ["RAG_SYSTEM_MESSAGE_REF"]

# Azure Blob Storageのクライアントを初期化
credential = DefaultAzureCredential()
blob_con_str = os.environ[
    "AZURE_STORAGE_CONNECTION_STRING"
]  # ストレージアカウント接続文字列
blob_container = os.environ["AZURE_STORAGE_CONTAINER"]  # 取得先のコンテナ
blob_service_client = BlobServiceClient(account_url=blob_con_str, credential=credential)
app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


@app.route(route="rag-chat")
@rag_chat_error_handler
def rag_chat(req: func.HttpRequest) -> func.HttpResponse:
    req_body = req.get_json()
    model = req_body.get("model")  # モデルの取得

    # モデルごとのreasoning_effort設定
    reasoning_effort = None
    if model == "gpt-5.2":
        reasoning_effort = "none"
    elif model == "gpt-5.2-reasoning":
        model = "gpt-5.2"
        reasoning_effort = "medium"

    search_method = req_body.get("searchMethod")  # 検索手法の取得

    def inner_rag_chat(req: func.HttpRequest) -> func.HttpResponse:
        response_start_time = time.time()
        user_message = req_body.get("question")
        chat_history = req_body.get("chatHistory", [])
        category = req_body.get("category")
        file_name: Optional[str] = req_body.get("fileName")
        media_type: Optional[str] = req_body.get("mediaType")
        image_url: Optional[str] = None
        file_content: Optional[Union[bytes, str]] = None
        file_extension: Optional[str] = None
        if media_type and file_name:
            container_client = create_tempfile_container_client()
            blob_client: BlobClient = container_client.get_blob_client(blob=file_name)
            blob_data = blob_client.download_blob().readall()
            if "image" in media_type:
                image_content = base64.encodebytes(blob_data).decode("utf-8")
                image_url = f"data:{media_type};base64,{image_content}"
            else:
                # 既存の実装に合わせてbase64にエンコード、将来的にはバイトストリームのままに変更したい。
                file_content = base64.encodebytes(blob_data).decode("utf-8")
            file_extension = os.path.splitext(file_name)[1].replace(".", "")
        logging.info(f"Received messages: {user_message}")
        logging.info(f"Received chat history: {chat_history}")
        logging.info(f"Selected model: {model}")
        logging.info(f"Selected search method: {search_method}")
        logging.info(f"Selected category: {category}")

        if not user_message:
            logging.info("user_message is required")
            return func.HttpResponse(
                "user_messageは必須です", status_code=400, mimetype="text/plain"
            )

        # モデルが許可されていない場合、エラーメッセージを返す
        if model not in ALLOWED_MODELS:
            logging.info(f"Invalid model: {model}")
            return func.HttpResponse("無効なモデルです", status_code=400)

        # 検索手法が許可されていない場合、エラーメッセージを返す
        if search_method not in ALLOWED_SEARCH_METHODS:
            logging.info(f"Invalid search method: {search_method}")
            return func.HttpResponse("無効な検索方法です", status_code=400)

        # ファイルの内容をテキストに変換
        if file_content:
            file_content = get_file_content(file_content, file_extension)
        else:
            file_content = ""

        # 入力プロンプトの作成
        messages = []
        messages.append({"role": "system", "content": system_message_ref})
        messages.extend(chat_history)
        received_file_text = None
        if file_name:
            received_file_text = (
                f"# 添付ファイルの内容\nファイル名：{file_name}\n{file_content}"
            )
            user_message = f"{user_message}\n\n{received_file_text}"
        if image_url:
            messages.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_message},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            )
        else:
            messages.append({"role": "user", "content": user_message})

        print("-----RAG検索を実施します-----")
        (
            user_message,
            contextualized_query_time,
            contx_intput_token,
            contx_output_token,
        ) = gen_contextualized_query(
            chat_history,
            user_message,
            model,
            reasoning_effort,
        )
        user_message_rev, used_dictionary_ids, dictionary_processing_time = (
            dictionary_registration(user_message)
        )
        logging.info(f"user_message_rev: {user_message_rev}")

        input_tokens = 0  # ここでinput_tokensを初期化
        output_tokens = 0  # ここでoutput_tokensを初期化

        (
            structured_answer,
            answer,
            user_content_embedding_tokens,
            answer_generation_time,
            input_tokens_add,
            output_tokens_add,
            index_name,
            ref_text,
            ref_text_structured,
            ref_text_qa,
            embedding_time,
            qa_search_time,
            document_search_time,
        ) = completion_rag_with_ref(
            user_message_rev,
            messages,
            search_method,
            model,
            category,
            reasoning_effort,
        )

        chat_history.append({"role": "user", "content": user_message})
        chat_history.append({"role": "assistant", "content": answer})

        # レコメンドの取得
        recommend = generate_recommend(chat_history)

        (
            thread_title,
            title_input_tokens,
            title_output_tokens,
            title_response_time,
        ) = generate_thread_title(chat_history)

        # レスポンス時間を計算
        total_search_time = sum(
            [
                contextualized_query_time,
                dictionary_processing_time,
                embedding_time,
                qa_search_time,
                document_search_time,
            ]
        )

        total_api_time = round(time.time() - response_start_time, 3)

        # JSON形式でレスポンスを返す
        response_data = {
            "answer": answer,
            "chatHistory": chat_history,
            "refAns": structured_answer,
            "totalApiTime": total_api_time,
            "inputTokens": input_tokens + input_tokens_add + contx_intput_token,
            "outputTokens": output_tokens + output_tokens_add + contx_output_token,
            "userContentEmbeddingTokens": user_content_embedding_tokens,
            "receivedFileText": received_file_text,
            "refText": ref_text_structured,
            "selectedIndex": index_name,
            "dictionaryId": used_dictionary_ids,
            "refText_qa": ref_text_qa,
            "contextualizedQueryTime": contextualized_query_time,
            "contextualizedQuery": user_message,
            "dictionaryProcessingTime": dictionary_processing_time,
            "correctedQuery": user_message_rev,
            "embeddingTime": embedding_time,
            "qaSearchTime": qa_search_time,
            "documentSearchTime": document_search_time,
            "totalSearchTime": total_search_time,
            "answerGenerationTime": answer_generation_time,
            "recommend": recommend,
        }
        if len(chat_history) <= 2:
            response_data |= {
                "threadTitle": thread_title,
                "titleResponseTime": title_response_time,
                "titleInputToken": title_input_tokens,
                "titleOutputToken": title_output_tokens,
            }
        logging.info(f"refText: {ref_text}")
        logging.info(f"response_data: {response_data}")

        return func.HttpResponse(
            json.dumps(response_data, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )

    return inner_rag_chat(req)
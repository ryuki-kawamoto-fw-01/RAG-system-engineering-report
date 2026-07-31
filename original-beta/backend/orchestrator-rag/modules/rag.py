import base64
import json
import logging
import os
import time
from typing import List

import requests
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from openai import AzureOpenAI
from pydantic import BaseModel, Field

# Azure OpenAIのクライアントを初期化
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

aoai_client = AzureOpenAI(
    azure_endpoint=os.environ["LOAD_BALANCER_ENDPOINT"],
    azure_ad_token_provider=token_provider,
    api_version=os.environ["AZURE_OPENAI_VERSION"],
)

# Azure OpenAIのオプション
model_identifier = os.environ["MODEL_IDENTIFIER"]
top_p = float(os.environ["TOP_P"])

# Azure AI Searchの検索オプション
search_strictness = os.environ.get("AZURE_AISEARCH_STRICTNESS", "3")
search_topNDocuments = os.environ.get("AZURE_AISEARCH_TOPNDOCUMENTS", "5")
default_category = os.environ.get("DEFAULT_CATEGORY")
qa_index_name = os.environ.get("AZURE_AISEARCH_QA_INDEX")
search_topNDocuments_qa = os.environ.get("AZURE_AISEARCH_TOPNDOCUMENTS_QA", "2")
qa_search_id_field = os.environ.get("AZURE_AISEARCH_QA_ID_FIELD")
qa_search_question_field = os.environ.get("AZURE_AISEARCH_QA_QUESTION_FIELD")
qa_search_answer_field = os.environ.get("AZURE_AISEARCH_QA_ANSWER_FIELD")
qa_search_vector_field = os.environ.get("AZURE_AISEARCH_QA_VECTOR_FIELD")
qa_search_semantic_config = os.environ.get("AZURE_AISEARCH_QA_SEMANTIC_CONFIG")


# Azure AI Search Knowledge Agent の設定
knowledge_source_name = os.environ.get("AZURE_AISEARCH_KNOWLEDGE_SOURCE")
knowledge_agent_name = os.environ.get("AZURE_AISEARCH_KNOWLEDGE_AGENT")


# responseフォーマットの指定
class Citation(BaseModel):
    rawdata_name: str = Field(..., description="引用ドキュメントのタイトル")
    rawdata_path: str = Field(..., description="引用ドキュメントのダウンロード用パス")
    pagedata_path: str = Field(..., description="引用ドキュメントのプレビュー用パス")


class ResponseSegment(BaseModel):
    text: str = Field(..., description="引用を元に生成したテキスト")
    citation: List[Citation] = Field(..., description="引用ドキュメントのリスト")


class AIResponse(BaseModel):
    segments: List[ResponseSegment]


def completion_rag_with_ref(
    user_message_rev, messages, search_method, model, category, reasoning_effort=None
):
    """
    RAG検索を行い、引用ドキュメントを紐付けた回答を生成する
    """
    user_content_embedding_tokens = 0
    user_content_embedding_tokens_qa = 0
    # カテゴリが指定されていない場合はデフォルトのカテゴリを使用
    index_name = category if category else default_category
    logging.info(f"Using index name: {index_name}")

    # 過去QAを検索
    embedding_time = float(0)
    if search_method == "semantic-hybrid-search":
        (
            ref_text_qa,
            user_content_embedding_tokens_qa,
            qa_search_time,
            embedding_time,
        ) = semantic_hybrid_search_qa(user_message_rev, qa_index_name)
    else:
        ref_text_qa, qa_search_time = keyword_search_qa(user_message_rev, qa_index_name)
    logging.info(f"ref_text_qa: {ref_text_qa}")

    # AISearchで検索
    if search_method == "semantic-hybrid-search":
        (
            ref_text,
            ref_text_structured,
            user_content_embedding_tokens,
            document_search_time,
            embedding_time_search,
            log_list,
        ) = semantic_hybrid_search(
            user_message_rev, index_name
        )  # work her
        embedding_time += embedding_time_search
    else:
        ref_text, ref_text_structured, document_search_time, _ = keyword_search(
            user_message_rev, index_name
        )

    # 過去QAと社内情報検索結果を統合
    ref_text_all = integrate_qa_and_ref(ref_text_qa, ref_text)

    start_time = time.time()
    # 検索結果を含めたプロンプトでリクエスト
    structured_answer, input_tokens_add, output_tokens_add = request_ref_rag(
        messages,
        ref_text_all,
        model,
        reasoning_effort if "reasoning_effort" in locals() else None,
    )
    end_time = time.time()
    answer_generation_time = round(end_time - start_time, 5)

    # テキスト部分のみ抽出し、回答全文を作成
    answer = ""
    for segment in structured_answer:
        answer += segment.text

    return (
        # structured_answer,
        [serialize_response_segment(seg) for seg in structured_answer],
        answer,
        user_content_embedding_tokens + user_content_embedding_tokens_qa,
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
    )


def semantic_hybrid_search_qa(user_message_rev, index_name):
    # ユーザプロンプトをEmbedding
    search_client = SearchClient(
        endpoint=os.environ.get("AZURE_AISEARCH_ENDPOINT"),
        index_name=index_name,
        credential=credential,
    )
    emb_start_time = time.time()
    embedding_response = aoai_client.embeddings.create(
        input=[user_message_rev], model=os.environ.get("EMBEDDING_MODEL")
    )
    emb_end_time = time.time()
    embedding_vector = embedding_response.data[0].embedding
    user_content_embedding_tokens = embedding_response.usage.total_tokens
    vector_query = VectorizedQuery(
        vector=embedding_vector, k_nearest_neighbors=3, fields=qa_search_vector_field
    )

    # ハイブリットセマンティック検索
    search_options = {
        "top": search_topNDocuments_qa,
        "select": [
            qa_search_id_field,
            qa_search_question_field,
            qa_search_answer_field,
        ],
    }
    start_time = time.time()
    search_results = search_client.search(
        user_message_rev,
        **search_options,
        vector_queries=[vector_query],
        query_type="semantic",
        semantic_configuration_name=qa_search_semantic_config,
    )
    end_time = time.time()
    # AI Searchの処理時間を計算
    search_processing_time = round(end_time - start_time, 5)
    embedding_time = round(emb_end_time - emb_start_time, 5)

    ref_text = format_search_result_qa(search_results)

    return (
        ref_text,
        user_content_embedding_tokens,
        search_processing_time,
        embedding_time,
    )


def keyword_search_qa(user_message_rev, index_name):
    # キーワード検索
    search_client = SearchClient(
        endpoint=os.environ.get("AZURE_AISEARCH_ENDPOINT"),
        index_name=index_name,
        credential=credential,
    )
    search_options = {
        "top": search_topNDocuments,
        "select": [
            qa_search_id_field,
            qa_search_question_field,
            qa_search_answer_field,
        ],
    }
    start_time = time.time()
    search_results = search_client.search(
        user_message_rev,
        **search_options,
    )
    end_time = time.time()
    # AI Searchの処理時間を計算
    search_processing_time = round(end_time - start_time, 5)

    ref_text = format_search_result_qa(search_results)

    return ref_text, search_processing_time


def format_search_result_qa(search_results):
    ref_text = ""
    for result in search_results:
        qa_str = "{質問: %s, 回答: %s}," % (
            result[qa_search_question_field],
            result[qa_search_answer_field],
        )
        content_str = "{content: %s, rawdata_name: %s, rawdata_path: %s }," % (
            qa_str,
            f"FAQ ID:{result[qa_search_id_field]}",
            result[qa_search_id_field],
        )

        ref_text += content_str
    ref_text = f"[{ref_text}]"

    return ref_text


def semantic_hybrid_search(user_message_rev, index_name):
    # ユーザプロンプトをEmbedding
    search_client = SearchClient(
        endpoint=os.environ.get("AZURE_AISEARCH_ENDPOINT"),
        index_name=index_name,
        credential=credential,
    )
    emb_start_time = time.time()
    embedding_response = aoai_client.embeddings.create(
        input=[user_message_rev], model=os.environ.get("EMBEDDING_MODEL")
    )
    emb_end_time = time.time()
    embedding_vector = embedding_response.data[0].embedding
    user_content_embedding_tokens = embedding_response.usage.total_tokens
    vector_query = VectorizedQuery(
        vector=embedding_vector, k_nearest_neighbors=3, fields="vector"
    )

    # ハイブリットセマンティック検索
    search_options = {
        "top": search_topNDocuments,
        "select": ["chunk", "title", "rawdata_name", "rawdata_path", "pagedata_path"],
    }
    start_time = time.time()
    search_results = search_client.search(
        user_message_rev,
        **search_options,
        vector_queries=[vector_query],
        query_type="semantic",
        semantic_configuration_name="semantic-01",
    )
    end_time = time.time()
    # AI Searchの処理時間を計算
    search_processing_time = round(end_time - start_time, 5)
    embedding_time = round(emb_end_time - emb_start_time, 5)

    search_results = list(search_results)
    logging.info(
        f"AI Search semantic-hybrid response (index: {index_name}): {json.dumps([dict(r) for r in search_results], ensure_ascii=False, default=str)}"
    )
    
    # メタデータが欠けているドキュメントを除外
    results_before_filter = len(search_results)
    search_results = filter_valid_search_results(search_results)
    results_after_filter = len(search_results)
    if results_before_filter != results_after_filter:
        logging.warning(
            f"Filtered out {results_before_filter - results_after_filter} documents with null metadata "
            f"(before: {results_before_filter}, after: {results_after_filter})"
        )
    
    ref_text = format_search_result(search_results)
    ref_text_structured = format_search_result_structured(search_results)
    log_list = format_search_result_for_log(search_results)
    return (
        ref_text,
        ref_text_structured,
        user_content_embedding_tokens,
        search_processing_time,
        embedding_time,
        log_list,
    )


def agentic_retrieval_search(user_message_rev, index_name):
    """
    Azure AI Search Knowledge Agent を使用してエージェンティック検索を実行
    """
    start_time = time.time()

    # Azure AI Search エンドポイントとトークンを取得
    search_endpoint = os.environ.get("AZURE_AISEARCH_ENDPOINT")

    if index_name == default_category:
        # デフォルトカテゴリの場合は環境変数から取得
        source_name = knowledge_source_name
        agent_name = knowledge_agent_name
    else:
        # index-xxx から xxx 部分を抽出して命名規則に従って生成
        index_suffix = index_name.replace("index-", "")
        source_name = f"{index_suffix}-knowledge-source"
        agent_name = f"{index_suffix}-knowledge-agent"

    # まず、ナレッジソースが存在するかチェック
    try:
        token = credential.get_token("https://search.azure.com/.default").token
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # ナレッジソースの存在確認
        ks_check_url = f"{search_endpoint}/knowledgeSources/{source_name}"
        ks_response = requests.get(
            f"{ks_check_url}?api-version=2025-08-01-preview", headers=headers
        )
        if ks_response.status_code != 200:
            logging.error(f"Knowledge source '{source_name}' not found or inaccessible")
            return "[]", [], 0, 0.0, 0.0, []

        # ナレッジエージェントの存在確認
        agent_check_url = f"{search_endpoint}/agents/{agent_name}"
        agent_response = requests.get(
            f"{agent_check_url}?api-version=2025-08-01-preview", headers=headers
        )
        if agent_response.status_code != 200:
            logging.error(f"Knowledge agent '{agent_name}' not found or inaccessible")
            return "[]", [], 0, 0.0, 0.0, []

    except Exception as e:
        logging.error(f"Error checking knowledge source/agent: {e}")
        return "[]", [], 0, 0.0, 0.0, []

    # トークンプロバイダーを使用してBearerトークンを取得
    token = credential.get_token("https://search.azure.com/.default").token

    # Knowledge Agent Retrieve API の URL
    retrieve_url = f"{search_endpoint}/agents('{agent_name}')/retrieve"

    # リクエストヘッダー
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # リクエストボディ（Microsoft Learn ドキュメントに基づく形式）
    request_body = {
        "messages": [
            {"role": "user", "content": [{"type": "text", "text": user_message_rev}]}
        ],
        "knowledgeSourceParams": [
            {"knowledgeSourceName": source_name, "kind": "searchIndex"}
        ],
    }

    try:
        # Knowledge Agent Retrieve API を呼び出し
        response = requests.post(
            f"{retrieve_url}?api-version=2025-08-01-preview",
            headers=headers,
            json=request_body,
        )

        response.raise_for_status()

        # レスポンスを解析
        result = response.json()
        logging.info(
            f"AI Search agentic response (agent: {agent_name}): {json.dumps(result, ensure_ascii=False, indent=2)}"
        )

        # 検索処理時間を計算
        end_time = time.time()
        search_processing_time = round(end_time - start_time, 5)

        # レスポンスから検索結果を抽出し、既存のフォーマットに合わせる
        formatted_results = format_agentic_search_results(result)

        # 既存の関数と同じ戻り値形式を維持
        ref_text = formatted_results["ref_text"]
        ref_text_structured = formatted_results["ref_text_structured"]
        log_list = formatted_results["log_list"]

        # エージェンティック検索ではembeddingは内部で処理されるため0に設定
        user_content_embedding_tokens = 0
        embedding_time = 0

        return (
            ref_text,
            ref_text_structured,
            user_content_embedding_tokens,
            search_processing_time,
            embedding_time,
            log_list,
        )

    except requests.exceptions.RequestException as e:
        logging.error(f"Agentic retrieval search failed: {e}")
        if hasattr(e, "response") and e.response is not None:
            try:
                error_detail = e.response.json()
                logging.error(
                    f"Error response body: {json.dumps(error_detail, ensure_ascii=False)}"
                )
            except Exception:
                logging.error(f"Error response text: {e.response.text}")
        # エラー時は空の結果を返す
        return "[]", [], 0, 0.0, 0.0, []
    except Exception as e:
        logging.error(f"Unexpected error in agentic retrieval search: {e}")
        return "[]", [], 0, 0.0, 0.0, []


def format_agentic_search_results(agentic_result):
    """
    Knowledge Agent の検索結果を既存のフォーマットに変換
    """
    ref_text = ""
    ref_text_structured = []
    log_list = []

    try:
        # レスポンスから引用文書を取得
        references = agentic_result.get("references", [])
        response_segments = agentic_result.get("response", [])

        # 応答テキストを取得（回答合成が有効な場合）
        response_text = ""
        if response_segments:
            for segment in response_segments:
                content = segment.get("content", [])
                for content_item in content:
                    if content_item.get("type") == "text":
                        response_text += content_item.get("text", "")

        # 参照文書からメタデータを抽出
        extracted_docs = []

        # まず、responseセクションからJSONデータを抽出
        if response_segments:
            for segment in response_segments:
                content = segment.get("content", [])
                for content_item in content:
                    if content_item.get("type") == "text":
                        text_content = content_item.get("text", "")
                        # JSONとして解析を試行
                        try:
                            json_data = json.loads(text_content)
                            if isinstance(json_data, list):
                                extracted_docs.extend(json_data)
                            else:
                                extracted_docs.append(json_data)
                        except json.JSONDecodeError:
                            # JSONではない場合は、そのままテキストとして扱う
                            extracted_docs.append(
                                {
                                    "ref_id": 0,
                                    "title": "Knowledge Agent Response",
                                    "content": text_content,
                                }
                            )

        # extracted_docsが空の場合は、referencesから情報を取得
        if not extracted_docs:
            for i, ref in enumerate(references):
                source_data = ref.get("sourceData", {})
                doc_key = ref.get("docKey", f"doc_{i}")

                doc_info = {
                    "ref_id": i,
                    "title": (
                        source_data.get("title", doc_key) if source_data else doc_key
                    ),
                    "content": (
                        source_data.get("content", "No content available")
                        if source_data
                        else "No content available"
                    ),
                }
                extracted_docs.append(doc_info)

        # extracted_docsを使用して既存のフォーマットに変換
        for i, doc in enumerate(extracted_docs):
            title = doc.get("title", "Knowledge Agent Result")
            content = doc.get("content", "")

            # referencesから対応するsourceDataを取得
            source_data = None
            if i < len(references):
                source_data = references[i].get("sourceData", {})

            # Base64デコードされたrawdata_nameを取得
            rawdata_name = title
            rawdata_path = ""
            pagedata_path = ""

            if source_data:
                rawdata_name = safe_decode(source_data.get("rawdata_name", ""))
                rawdata_path = safe_decode(source_data.get("rawdata_path", ""))
                pagedata_path = safe_decode(source_data.get("pagedata_path", ""))
                if not rawdata_name:  # デコードできない場合はtitleを使用
                    rawdata_name = source_data.get("title", title)

            # ref_text 形式（既存のformat_search_result関数と同じ形式）
            content_str = (
                "{content: %s, title: %s, rawdata_name: %s, rawdata_path: %s, pagedata_path: %s },"
                % (content, title, rawdata_name, rawdata_path, pagedata_path)
            )
            ref_text += content_str

            # ref_text_structured 形式（format_search_result_structuredと同じ形式）
            ref_text_structured.append(
                {
                    "content": content,
                    "search_filepath": rawdata_path,
                    "search_title": rawdata_name,
                }
            )

            # log_list 形式（format_search_result_for_logと同じ形式）
            log_list.append(
                {
                    "chunk": content,
                    "source": {
                        "title": rawdata_name,
                        "url": rawdata_path,
                    },
                }
            )

        # 結果がない場合は応答テキストのみを含める
        if not references and response_text:
            content_str = (
                "{content: %s, title: %s, rawdata_name: %s, rawdata_path: %s, pagedata_path: %s },"
                % (response_text, "Agent Response", "Knowledge Agent", "", "")
            )
            ref_text = content_str

            ref_text_structured.append(
                {
                    "content": response_text,
                    "search_filepath": "",
                    "search_title": "Knowledge Agent",
                }
            )

            log_list.append(
                {
                    "chunk": response_text,
                    "source": {
                        "title": "Knowledge Agent",
                        "url": "",
                    },
                }
            )

        ref_text = f"[{ref_text}]"

    except Exception as e:
        logging.error(f"Error formatting agentic search results: {e}")
        ref_text = "[]"
        ref_text_structured = []
        log_list = []

    return {
        "ref_text": ref_text,
        "ref_text_structured": ref_text_structured,
        "log_list": log_list,
    }


def keyword_search(user_message_rev, index_name):
    # キーワード検索
    search_client = SearchClient(
        endpoint=os.environ.get("AZURE_AISEARCH_ENDPOINT"),
        index_name=index_name,
        credential=credential,
    )
    search_options = {
        "top": search_topNDocuments,
        "select": ["chunk", "title", "rawdata_name", "rawdata_path", "pagedata_path"],
    }
    start_time = time.time()
    search_results = search_client.search(
        user_message_rev,
        **search_options,
    )
    end_time = time.time()
    # AI Searchの処理時間を計算
    search_processing_time = round(end_time - start_time, 5)

    search_results = list(search_results)
    logging.info(
        f"AI Search keyword response (index: {index_name}): {json.dumps([dict(r) for r in search_results], ensure_ascii=False, default=str)}"
    )
    
    # メタデータが欠けているドキュメントを除外
    results_before_filter = len(search_results)
    search_results = filter_valid_search_results(search_results)
    results_after_filter = len(search_results)
    if results_before_filter != results_after_filter:
        logging.warning(
            f"Filtered out {results_before_filter - results_after_filter} documents with null metadata "
            f"(before: {results_before_filter}, after: {results_after_filter})"
        )
    
    ref_text = format_search_result(search_results)
    ref_text_structured = format_search_result_structured(search_results)
    log_list = format_search_result_for_log(search_results)

    return ref_text, ref_text_structured, search_processing_time, log_list


def format_search_result(search_results):
    ref_text = ""
    for result in search_results:
        content_str = (
            "{content: %s, title: %s, rawdata_name: %s, rawdata_path: %s, pagedata_path: %s },"
            % (
                result.get("chunk", ""),
                result.get("title", ""),
                safe_decode(result.get("rawdata_name")) or "不明",
                safe_decode(result.get("rawdata_path")) or "不明",
                safe_decode(result.get("pagedata_path")) or "不明",
            )
        )
        ref_text += content_str
    ref_text = f"[{ref_text}]"

    return ref_text


def format_search_result_structured(search_results):
    log_list = []
    for result in search_results:
        log_list.append(
            {
                "content": result.get("chunk", ""),
                "search_filepath": safe_decode(result.get("rawdata_path")) or "不明",
                "search_title": safe_decode(result.get("rawdata_name")) or "不明",
            }
        )
    return log_list


def format_search_result_for_log(search_results):
    log_list = []
    for result in search_results:
        log_list.append(
            {
                "chunk": result.get("chunk", ""),
                "source": {
                    "title": safe_decode(result.get("rawdata_name")) or "不明",
                    "url": safe_decode(result.get("rawdata_path")) or "不明",
                },
            }
        )
    return log_list


def format_for_ref_text_qa(log_list):
    return [
        {
            "content": item["chunk"],
            "search_title": item["source"]["title"],
            "search_filepath": item["source"]["url"],
        }
        for item in log_list
    ]


def request_ref_rag(messages, ref_text, model, reasoning_effort=None):
    latest_message = messages.pop()

    azure_endpoint = os.environ["LOAD_BALANCER_ENDPOINT"]
    model = f"{model}-{model_identifier}"

    aoai_client = AzureOpenAI(
        azure_endpoint=azure_endpoint,
        azure_ad_token_provider=token_provider,
        api_version=os.environ["AZURE_OPENAI_VERSION"],
    )
    # contentの型をチェックして処理を分岐
    if isinstance(latest_message["content"], list):
        # contentがリストの場合
        text_content = ""
        image_url = None

        for item in latest_message["content"]:
            if item["type"] == "text":
                text_content = item["text"]
            elif item["type"] == "image_url":
                image_url = item["image_url"]["url"]

        text_content = f"""
        {text_content}
        ## 引用情報
        {ref_text}
        """

        latest_message["content"] = [
            {"type": "text", "text": text_content},
            {"type": "image_url", "image_url": {"url": image_url}},
        ]
    else:
        # contentが文字列の場合
        text_content = latest_message["content"]

        text_content = f"""
        {text_content}
        ## 引用情報
        {ref_text}
        """

        # 書き換えた内容をlatest_messageに戻す
        latest_message["content"] = text_content

    # messagesに戻す
    messages.append(latest_message)
    params = {
        "model": model,
        "messages": messages,
        "response_format": AIResponse,
    }

    if reasoning_effort is not None:
        params["reasoning_effort"] = reasoning_effort

    completion = aoai_client.beta.chat.completions.parse(**params)

    structured_answer = completion.choices[0].message.parsed.segments
    input_tokens_add = completion.usage.prompt_tokens
    output_tokens_add = completion.usage.completion_tokens

    return structured_answer, input_tokens_add, output_tokens_add


def serialize_response_segment(segment):
    return {
        "text": segment.text,
        "citation": [
            {
                "rawdata_name": c.rawdata_name,
                "rawdata_path": c.rawdata_path,
                "pagedata_path": c.pagedata_path,
            }
            for c in segment.citation
        ],
    }


def integrate_qa_and_ref(ref_text_qa, ref_text):
    ref_text_all = f"\n### 過去QA情報\n {ref_text_qa}\n ### 社内資料情報\n {ref_text}"
    return ref_text_all


def filter_valid_search_results(search_results):
    """
    rawdata_name, rawdata_path, pagedata_pathのいずれか1つでもnullの場合、そのドキュメントを除外する
    """
    valid_results = []
    for result in search_results:
        has_rawdata_name = result.get("rawdata_name") is not None
        has_rawdata_path = result.get("rawdata_path") is not None
        has_pagedata_path = result.get("pagedata_path") is not None
        
        if has_rawdata_name and has_rawdata_path and has_pagedata_path:
            valid_results.append(result)
    return valid_results


def safe_decode(value):
    """Safely decode base64 value, handling None values gracefully."""
    if value is None:
        return ""
    try:
        return base64.b64decode(value).decode("utf-8")
    except Exception as e:
        print(f"Error decoding base64 value: {e}")
        return ""

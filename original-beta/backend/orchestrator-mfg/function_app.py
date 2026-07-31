import base64
import json
import logging
import os
from typing import Dict, List, Union

import azure.functions as func
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest, AnalyzeResult
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from openai import AzureOpenAI

from controller.analyze import analyze_bp
from modules.aoai import create_aoai_answer
from modules.system import get_cve_chat_system_message

# Azure OpenAI クライアントの初期化
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)


app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# データ分析APIのエンドポイント
app.register_functions(analyze_bp)


# レスポンス用関数
def success_response(response_data: Union[Dict, List, str]) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


def vectorize_documents(content):
    # ベクトル化されたドキュメントを返す
    aoai_client = AzureOpenAI(
        azure_endpoint=os.environ["LOAD_BALANCER_ENDPOINT"],
        azure_ad_token_provider=token_provider,
        api_version=os.environ["AZURE_OPENAI_VERSION"],
    )

    embedding_response = aoai_client.embeddings.create(
        input=content, model=os.environ["EMBEDDING_MODEL"]
    )
    embedding_vector = embedding_response.data[0].embedding
    return embedding_vector


@app.route(route="documentSearch", auth_level=func.AuthLevel.ANONYMOUS)
def documentSearch(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("ファイル取得処理開始")
    try:
        searchWord = req.get_json().get("searchWord", "")
        checkCandidateCount = req.get_json().get("checkCandidateCount", "")
        logging.info(f"検索ワード: {searchWord}")
        logging.info(f"チェック候補件数: {checkCandidateCount}")

        searchClient = SearchClient(
            endpoint=os.environ["AZURE_AISEARCH_ENDPOINT"],
            index_name=os.environ["AZURE_AISEARCH_INDEX"],
            credential=credential,
        )
        logging.info("SearchClientの初期化完了")

        aoai_client = AzureOpenAI(
            azure_endpoint=os.environ["LOAD_BALANCER_ENDPOINT"],
            azure_ad_token_provider=token_provider,
            api_version=os.environ["AZURE_OPENAI_VERSION"],
        )
        logging.info("AzureOpenAIクライアントの初期化完了")

        results = searchClient.search(
            search_text="",
            vector_queries=[
                VectorizedQuery(
                    kind="vector",
                    vector=vectorize_documents(searchWord),
                    k_nearest_neighbors=checkCandidateCount,
                    fields="vector",
                )
            ],
        )
        logging.info(f"ベクトルクエリ：{vectorize_documents(searchWord)}")
        logging.info("検索クエリの実行完了")

        answerList = []
        sourceList = []
        for result in results:
            input = searchWord
            # checkCriteriaには検索結果のchunkを格納
            checkCriteria = result.get("chunk")

            logging.info(f"検索結果の処理中: {checkCriteria}")

            system_message = "あなたは工場などの施設の設計を行うプロです。施設を設計する上でのチェック基準を提供します。"

            prompt_template = """
            #checkCriteria の内容を確認し、# inputの内容をチェックできるチェック基準として整形してください。
            表形式のデータは、表形式のデータとして整形してください。
            json形式のデータは、現象や原因、対策をもとにチェック基準の文章として整形してください。
            回答は整形した結果のみを記載してください。

            # input
            {input} 
            # checkCriteria
            {checkCriteria}
            """

            prompt = prompt_template.format(input=input, checkCriteria=checkCriteria)
            try:
                response = aoai_client.chat.completions.create(
                    model=os.environ["DEPLOYMENT_NAME"],
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt},
                    ],
                    # max_completion_tokens = 5000
                )
                logging.info("AzureOpenAIクエリの実行完了")
            except Exception as e:
                logging.error(f"AzureOpenAIクエリの実行中にエラーが発生: {e}")
                return func.HttpResponse(
                    json.dumps({"success": False, "error": str(e)}, ensure_ascii=False),
                    status_code=500,
                    mimetype="application/json",
                )

            answer = response.choices[0].message.content
            answerList.append(answer)
            sourceList.append(result.get("source"))

        logging.info("ファイル取得処理終了")

        return success_response(
            {"success": True, "answerList": answerList, "sourceList": sourceList}
        )
    except Exception as e:
        logging.error(f"ファイル取得処理中にエラーが発生: {e}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": str(e)}, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )


@app.route(route="designDocumentReview", auth_level=func.AuthLevel.ANONYMOUS)
def designDocumentReview(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("チェック処理開始")
    try:
        designDocument = req.get_json().get("designDocument", "")
        checkCriteriaList = req.get_json().get("checkCriteriaList", "")
        imageSrcData = req.get_json().get("imageSrcData", "")
        logging.info(f"設計ドキュメント: {designDocument}")
        logging.info(f"チェック基準リスト: {checkCriteriaList}")
        logging.info(f"画像ソースデータ: {imageSrcData}")

        aoai_client = AzureOpenAI(
            azure_endpoint=os.environ["LOAD_BALANCER_ENDPOINT"],
            azure_ad_token_provider=token_provider,
            api_version=os.environ["AZURE_OPENAI_VERSION"],
        )
        logging.info("AzureOpenAIクライアントの初期化完了")

        if imageSrcData != "":
            encoded = imageSrcData.split(",")[1]
            imageSrc = base64.b64decode(encoded)
            logging.info("画像のデコード完了")

            documentEndpoint = os.environ["AZURE_DOCUMENT_ENDPOINT"]
            credential = DefaultAzureCredential()
            documentClient = DocumentIntelligenceClient(
                documentEndpoint, credential=credential
            )
            logging.info("DocumentIntelligenceClientの初期化完了")

            try:
                poller = documentClient.begin_analyze_document(
                    "prebuilt-layout",
                    AnalyzeDocumentRequest(bytes_source=imageSrc),
                    output_content_format="markdown",
                )
                result: AnalyzeResult = poller.result()
                logging.info(f"画像のMarkdow化完了: {result.content}")
            except Exception as e:
                logging.error(f"画像のMarkdow化中にエラーが発生: {e}")
                return func.HttpResponse(
                    json.dumps({"success": False, "error": str(e)}, ensure_ascii=False),
                    status_code=500,
                    mimetype="application/json",
                )
        else:
            logging.info("画像ソースデータが提供されていません")

        answerList = []
        for checkCriteria in checkCriteriaList:
            if imageSrcData != "":
                input = result.content
            else:
                input = designDocument
            checkCriteria = checkCriteria
            logging.info(f"チェック基準の処理中: {checkCriteria}")

            system_message = "あなたは工場などの施設の設計を行うプロです。設計内容がチェック基準に沿っているか判断できます。"

            prompt_template = """
            # input の記載内容が、# checkCriteria の記載内容に沿った内容になっているかを判断してください。
            基準に沿っていない場合の注意点/リスク/対策案の提示もお願いします。

            # input
            {input} 

            # checkCriteria
            {checkCriteria}
            """

            prompt = prompt_template.format(input=input, checkCriteria=checkCriteria)
            try:
                response = aoai_client.chat.completions.create(
                    model=os.environ["DEPLOYMENT_NAME"],
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt},
                    ],
                    # max_completion_tokens = 5000
                )
                logging.info("AzureOpenAIクエリの実行完了")
            except Exception as e:
                logging.error(f"AzureOpenAIクエリの実行中にエラーが発生: {e}")
                return func.HttpResponse(
                    json.dumps({"success": False, "error": str(e)}, ensure_ascii=False),
                    status_code=500,
                    mimetype="application/json",
                )

            answer = response.choices[0].message.content
            answerList.append(answer)

        logging.info("チェック処理終了")

        return success_response(answerList)
    except Exception as e:
        logging.error(f"チェック処理中にエラーが発生: {e}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": str(e)}, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )


@app.route(route="cve-report", methods=["POST"])
def cve_report(req: func.HttpRequest) -> func.HttpResponse:

    try:
        form = req.form
        logging.info(f"form: {form}")

        if form is None:
            logging.error("form is required")
            return func.HttpResponse("入力が不正です", status_code=400)

        # フォームデータの取得
        input_text = form.get("cveNumber")
        past_qa = form.get("pastQA")
        current_cve_number = form.get("currentCveNumber")
        logging.info(f"current_cve_number: {current_cve_number}")

        if not input_text:
            logging.error("CVE番号が提供されていません")
            return func.HttpResponse("CVE番号が提供されていません", status_code=400)

        # チャットの処理 #
        chat_messages = [
            {
                "role": "system",
                "content": get_cve_chat_system_message(past_qa, current_cve_number),
            },
            {
                "role": "user",
                "content": f"# 入力メッセージ\n {input_text}",
            },
        ]

        logging.info(f"Chat Messages: {chat_messages}")

        cve_chat, cve_report = create_aoai_answer(chat_messages)
        logging.info(f"cve_chat: {cve_chat}")

        # レスポンスデータの作成
        response_data = {
            "original_text": input_text,
            "cve_chat": cve_chat,
            "cve_report": cve_report,
            "success": True,
        }

        logging.info(f"Response data: {response_data}")

    except Exception as e:
        logging.error(f"Error: {e}")
        error_response = {
            "error": "エラーが発生しました",
            "details": str(e),
            "success": False,
        }
        return func.HttpResponse(
            json.dumps(error_response, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )

    return func.HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

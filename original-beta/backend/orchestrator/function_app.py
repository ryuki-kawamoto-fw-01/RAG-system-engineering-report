import base64
import json
import logging
import os
import time
from typing import Optional, Union

import azure.functions as func
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.storage.blob import BlobClient, ContentSettings
from openai import AzureOpenAI  # BadRequestError

# from modules.chat_management import chat_management
from interceptor.chat import chat_error_handler
from modules.common import create_tempfile_container_client, generate_sas_url
from modules.error_handler import azure_function_error_handler  # ErrorHandler,
from modules.file_prompt import get_file_content
from modules.logging.constants import TAG_GROUPS
from modules.logging.logger import Logger, log_operation, trace
from modules.prompts.system import SYSTEM_MESSAGE
from modules.title import generate_thread_title
from modules.recommend import generate_recommend
from modules.utils import error_response, success_response  # get_current_date_time

# 許可されたモデルのリスト
ALLOWED_MODELS = ["gpt-5.2", "gpt-5.2-reasoning","gpt-4.1"]

# Azure OpenAI クライアントの初期化
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")

# Web検索ができるようになったらコメントアウトを外す
system_message = SYSTEM_MESSAGE
# system_message = SYSTEM_MESSAGE.format(current_date=get_current_date_time())

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

logger = Logger()


@app.route(route="upload-file", methods=["POST"])
@azure_function_error_handler
def upload_file(req: func.HttpRequest) -> func.HttpResponse:
    ALLOW_PATH_ROOT = ["temp"]
    files = req.files
    form = req.form
    if files is None or form is None or "file" not in files or "filename" not in form or "type" not in form:
        return error_response("不正な入力です", 400)
    file = files["file"]
    filename = form["filename"]
    media_type = form["type"]
    path_route = filename.split("/")
    # インデックス配下以外のフォルダ作成は禁止
    if path_route[0] not in ALLOW_PATH_ROOT:
        logging.error(f"不正なファイル作成：{filename}")
        return error_response("指定したフォルダはファイル作成が許可されていません", 403)

    container_client = create_tempfile_container_client()
    blob_client: BlobClient = container_client.get_blob_client(blob=filename)
    # 対象ファイルをbytes型で読み込んでコンテナへアップロード
    if blob_client.exists():  # 同名のファイルが存在するかの判定
        # 存在する場合、上書き登録
        blob_client.upload_blob(
            file,
            overwrite=True,
            content_settings=ContentSettings(content_type=media_type),
        )
    else:
        blob_client.upload_blob(
            file,
            overwrite=False,
            content_settings=ContentSettings(content_type=media_type),
        )
    url = generate_sas_url(filename)
    return success_response({"success": True, "filename": filename, "url": url})


@app.route(route="delete-file", methods=["POST"])
@azure_function_error_handler
def delete_file(req: func.HttpRequest) -> func.HttpResponse:
    ALLOW_PATH_ROOT = ["temp"]

    try:
        req_body = req.get_json()
    except ValueError:
        return error_response("不正な入力です", 400)

    if "filename" not in req_body:
        return error_response("不正な入力です", 400)

    filename = req_body["filename"]
    path_route = filename.split("/")

    # インデックス配下以外のフォルダ削除は禁止
    if path_route[0] not in ALLOW_PATH_ROOT:
        logging.error(f"不正なファイル削除：{filename}")
        return error_response("指定したフォルダはファイル削除が許可されていません", 403)

    container_client = create_tempfile_container_client()
    blob_client: BlobClient = container_client.get_blob_client(blob=filename)

    # 対象ファイルが存在するかの判定
    if not blob_client.exists():
        logging.error(f"ファイルが存在しません：{filename}")
        return error_response("指定したファイルは存在しません", 404)

    # ファイルを削除
    blob_client.delete_blob()
    logging.info(f"ファイル削除成功：{filename}")

    return success_response({"success": True, "filename": filename})


@app.route(route="chat")
@chat_error_handler
def chat(req: func.HttpRequest) -> func.HttpResponse:
    req_body = req.get_json()

    model = req_body.get("model")
    model_identifier = os.environ["MODEL_IDENTIFIER"]
    azure_endpoint = os.environ["LOAD_BALANCER_ENDPOINT"]
    
    # モデルごとのreasoning_effort設定
    reasoning_effort = None
    if model == "gpt-5.2":
        reasoning_effort = "none"
    elif model == "gpt-5.2-reasoning":
        model = "gpt-5.2"
        reasoning_effort = "medium"
    
    deploy_name = f"{model}-{model_identifier}"

    aoai_client = AzureOpenAI(
        azure_endpoint=azure_endpoint,
        azure_ad_token_provider=token_provider,
        api_version=os.environ["AZURE_OPENAI_VERSION"],
    )

    @log_operation(llm_type=model, input_value=None)
    def inner_chat(req: func.HttpRequest) -> func.HttpResponse:
        response_start_time = time.time()
        question = req_body.get("question")
        chat_history = req_body.get("chatHistory", [])
        file_name: Optional[str] = req_body.get("fileName")
        media_type: Optional[str] = req_body.get("mediaType")
        image_url: Optional[str] = None
        file_content: Optional[Union[str, bytes]] = None
        file_extension: Optional[str] = None

        if file_name and media_type:
            container_client = create_tempfile_container_client()
            blob_client: BlobClient = container_client.get_blob_client(blob=file_name)
            blob_data = blob_client.download_blob().readall()

            if "image" in media_type:
                # Base64にエンコードして埋め込んだURLを生成(ネットワークの関係でbase64URLを渡す)
                image_content = base64.encodebytes(blob_data).decode("utf-8")
                image_url = f"data:{media_type};base64,{image_content}"
            else:
                # Base64にエンコード
                file_content = base64.encodebytes(blob_data).decode("utf-8")

            file_extension = os.path.splitext(file_name)[1].replace(".", "")
        logging.info(f"Received question: {question}")
        logging.info(f"Selected model: {model}")
        if not question:
            logging.error("question is required")
            return func.HttpResponse("questionは必須です", status_code=400)
        if model not in ALLOWED_MODELS:
            logging.info(f"Invalid model: {model}")
            return func.HttpResponse("無効なモデルです", status_code=400)

        # ファイルの内容をテキストに変換
        if file_content:
            file_content = get_file_content(file_content, file_extension)
        else:
            file_content = ""

        received_file_text = None
        # ファイルが存在する場合、ファイルの内容と質問を結合して新しいプロンプトを作成
        if file_name:
            received_file_text = f"# 添付ファイルの内容\nファイル名：{file_name}\n{file_content}"
            question = f"{question}\n\n{received_file_text}"
            logging.info(f"ファイル結合された質問文: {question}")

        # formatted_search_results = None # Web検索ができるようになったらコメントアウトを外す

        if image_url:
            messages = [
                {"role": "system", "content": system_message},
                *chat_history[-6:],
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                },
            ]
        else:
            messages = [
                {"role": "system", "content": system_message},
                *chat_history[-6:],
                {"role": "user", "content": question},
            ]

        # trace chat pipeline

        with trace(
            user_id="user123",
            llm_type=model,
            name="response-generation",
            input_value=messages,
            metadata={"tags": TAG_GROUPS["CHAT"]},
        ) as rt:
            params = {
                "model": deploy_name,
                "messages": messages,  # type: ignore
                # "tools": [WEB_SEARCH_TOOL],  # 必要ならコメントアウト解除
            }

            if reasoning_effort is not None:
                params["reasoning_effort"] = reasoning_effort

            completion = aoai_client.chat.completions.create(**params)

            rt.output(completion)

            # Web検索ができるようになったらコメントアウトを外す
            # (formatted_search_results, chat_history) = chat_management(
            #     aoai_client, completion, chat_history, deploy_name, question, reasoning_effort
            # )

            # if formatted_search_results is not None:
            #         web_search_answer_response = aoai_client.chat.completions.create(
            #             model=deploy_name,
            #             messages=[
            #                 {"role": "system", "content": system_message},
            #                 *chat_history[-6:],
            #             ],  # type: ignore
            #         )

            #     chat_history.append(
            #         {  # type: ignore
            #             "role": "assistant",
            #             "content": web_search_answer_response.choices[0].message.content,  # type: ignore
            #         }
            #     )
            #     rt.set_chat_history(chat_history)
            #     rt.output(web_search_answer_response)

        # 回答の取得
        role = completion.choices[0].message.role  # web検索ができるようになったら消す
        answer = completion.choices[0].message.content
        chat_history.append({"role": "user", "content": question})
        chat_history.append({"role": role, "content": answer})  # web検索ができるようになったら消す

        logging.info(f"Answer: {answer}")

        input_tokens = completion.usage.prompt_tokens
        output_tokens = completion.usage.completion_tokens
        
        # レコメンドの取得
        recommend = generate_recommend(chat_history)

        # タイトルの取得
        (
            thread_title,
            title_input_tokens,
            title_output_tokens,
            title_response_time,
        ) = generate_thread_title(chat_history)

        # Web検索ができるようになったらコメントアウトを外す
        # if formatted_search_results and len(chat_history) <= 3:
        #     response_data = {
        #         "answer": chat_history[-1]["content"],  # type: ignore
        #         "searchResults": formatted_search_results,
        #         "chatHistory": chat_history,  # 更新されたチャット履歴を返す
        #         "receivedFileText": received_file_text,
        #         "threadTitle": thread_title,
        #     }
        # elif not formatted_search_results and len(chat_history) <= 1:
        #     response_data = {
        #         "answer": answer,
        #         "chatHistory": chat_history,  # 更新されたチャット履歴を返す
        #         "receivedFileText": received_file_text,
        #         "threadTitle": thread_title,
        #     }
        # elif formatted_search_results and len(chat_history) > 3:
        #     response_data = {
        #         "answer": chat_history[-1]["content"],  # type: ignore
        #         "searchResults": formatted_search_results,
        #         "chatHistory": chat_history,  # 更新されたチャット履歴を返す
        #         "receivedFileText": received_file_text,
        #     }

        # レスポンス時間を計算
        response_time = round(time.time() - response_start_time, 3)

        if len(chat_history) <= 2:  # Web検索ができるようになったら消す
            response_data = {
                "answer": answer,
                "chatHistory": chat_history,  # 更新されたチャット履歴を返す
                "receivedFileText": received_file_text,
                "chatProcessingTime": response_time,
                "threadTitle": thread_title,
                "titleInputToken": title_input_tokens,
                "titleOutputToken": title_output_tokens,
                "titleResponseTime": title_response_time,
                "inputTokens": input_tokens,
                "outputTokens": output_tokens,
                "recommend": recommend,
            }
        else:
            response_data = {
                "answer": answer,
                "chatHistory": chat_history,  # 更新されたチャット履歴を返す
                "receivedFileText": received_file_text,
                "chatProcessingTime": response_time,
                "recommend": recommend,
            }

        logging.info(f"Response data: {response_data}")

        return func.HttpResponse(
            json.dumps(response_data, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )

    return inner_chat(req)

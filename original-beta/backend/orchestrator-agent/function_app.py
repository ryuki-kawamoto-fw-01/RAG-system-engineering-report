import json
import os
from typing import Optional

import azure.functions as func
from azure.ai.inference.models import ChatCompletionsToolCall

from modules.agent.prompt import (  # MULTI_AGENT_RESEARCH_PROMPT_TEMPLATE,; MULTI_AGENT_RESEARCHER_SYSTEM_PROMPT,
    RESEARCH_PROMPT_TEMPLATE,
    RESEARCHER_SYSTEM_PROMPT,
)
from modules.const import AZURE_OPENAI_MODEL_NAME_ENV_KEY
from modules.di_container import di_container
from modules.error_handler import azure_function_error_handler

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)
model = os.environ.get(AZURE_OPENAI_MODEL_NAME_ENV_KEY)


def json_response(data, status_code=200):
    return func.HttpResponse(
        json.dumps({"success": True, "data": data}, ensure_ascii=False),
        status_code=status_code,
        mimetype="application/json",
    )


@app.route(route="planning")
@azure_function_error_handler
def planning(req: func.HttpRequest) -> func.HttpResponse:
    req_body = req.get_json()
    user_message: str = req_body["question"]
    chat_history = req_body.get("chatHistory", [])
    task: str = req_body.get("task", "rag")
    file_name: Optional[str] = req_body.get("fileName")
    media_type: Optional[str] = req_body.get("mediaType")
    file_url: Optional[str] = req_body.get("fileUrl")
    file_prefix: Optional[str] = req_body.get("file_prefix")
    prompt = RESEARCH_PROMPT_TEMPLATE.format(question=user_message)
    system_prompt = RESEARCHER_SYSTEM_PROMPT
    # if task == "specification":
    #     prompt = RESEARCH_PROMPT_TEMPLATE.format(question=user_message)
    #     system_prompt = RESEARCHER_SYSTEM_PROMPT
    # if task == "multi-agent":
    #     prompt = MULTI_AGENT_RESEARCH_PROMPT_TEMPLATE.format(question=user_message)
    #     system_prompt = MULTI_AGENT_RESEARCHER_SYSTEM_PROMPT
    planning = di_container.get_planning_use_case(
        model, task, system_prompt, file_prefix
    )
    data = planning.execute(
        question=prompt,
        messages=chat_history,
        file_name=file_name,
        media_type=media_type,
        file_url=file_url,
    )
    return json_response(data)


@app.route(route="tool-use")
@azure_function_error_handler
def tool_use(req: func.HttpRequest) -> func.HttpResponse:
    req_body = req.get_json()
    messages = req_body.get("messages", [])
    tool_calls = [ChatCompletionsToolCall(**t) for t in req_body["tool_calls"]]
    task: str = req_body.get("task", "rag")
    file_prefix: Optional[str] = req_body.get("file_prefix")
    pdf_to_image = req_body.get("pdf_to_image", True)

    # ツールの実行
    tool_use = di_container.get_tool_use_use_case(task, model, file_prefix)
    tool_use_output = tool_use.execute(messages, tool_calls)

    # PDF抽出処理（pdf_to_imageがTrueの場合のみ実行）
    if pdf_to_image:
        pdf_extractor = di_container.get_pdf_to_image_prompt_use_case()
        pdf_extraction_output = pdf_extractor.execute(
            tool_use_output["messages"], tool_use_output["tool_outputs"]
        )
        return json_response(pdf_extraction_output)

    # 通常のレスポンス
    return json_response(tool_use_output)


@app.route(route="reflection")
@azure_function_error_handler
def reflection(req: func.HttpRequest) -> func.HttpResponse:
    req_body = req.get_json()
    messages = req_body.get("messages", [])
    user_message_rev = req_body.get("user_message_rev")
    task = req_body.get("task")
    reflection = di_container.get_reflection_use_case(model, task)
    data = reflection.execute(messages=messages, user_message_rev=user_message_rev)
    return json_response(data)


@app.route(route="merge")
@azure_function_error_handler
def merge(req: func.HttpRequest) -> func.HttpResponse:
    req_body = req.get_json()
    messages = req_body.get("messages", [])
    user_message_rev = req_body.get("user_message_rev")
    merge_use_case = di_container.get_merge_use_case(model)
    data = merge_use_case.execute(messages=messages, user_message_rev=user_message_rev)
    return json_response(data)

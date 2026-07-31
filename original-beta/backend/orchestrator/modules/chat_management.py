import json
from typing import Dict, List, Tuple

from openai import AzureOpenAI

# from llmOps.init import langfuse
from openai.types.chat import (
    ChatCompletion,
    ChatCompletionMessage,
    ChatCompletionMessageToolCall,
)

from modules.context_retriever import retrieve_context
from modules.logging.constants import TAG_GROUPS
from modules.logging.logger import trace
from modules.prompts.keyword_variation import create_search_keyword_variation_prompt
from modules.prompts.rerank_search_result import create_rerank_search_results_prompt
from modules.prompts.response_format import (
    RERANK_FUNCTION,
    VARIY_KEYWORDS_FUNCTION,
    KeywordVariationResponse,
    RerankResponse,
)
from modules.utils import get_current_date_time
from modules.web_search import retireve_search_results_async


def chat_management(
    aoai_client: AzureOpenAI,
    response: ChatCompletion,
    chat_history: List[Dict[str, str | List[ChatCompletionMessageToolCall]]],
    deploy_name: str,
    question: str,
    reasoning_effort: str | None = None,
) -> Tuple[
    List[Dict[str, int | str]] | None,
    List[Dict[str, str | List[ChatCompletionMessageToolCall]]],
]:
    response_message: ChatCompletionMessage = response.choices[0].message
    if response_message.tool_calls is not None:
        for tool_call in response_message.tool_calls:  # type: ignore
            if tool_call.function.name == "web_search":
                # result = web_search(aoai_client, json.loads(tool_call.function.arguments)["query"], chat_history, model)
                result = web_search(aoai_client, question, chat_history, deploy_name, reasoning_effort)

                # ユーザーの質問と回答を結合
                chat_history.append(
                    {
                        "role": response_message.role,
                        "tool_calls": [
                            {
                                "id": tool_call.id,
                                "function": {
                                    "name": tool_call.function.name,
                                    "arguments": tool_call.function.arguments,
                                },
                                "type": "function",
                            }
                        ],  # type: ignore
                    }
                )

                chat_history.append(
                    {
                        "role": "tool",
                        "content": json.dumps(result),
                        "tool_call_id": tool_call.id,
                    }
                )

                return [result, chat_history]  # type: ignore
    if response_message.content is not None:
        chat_history.append({"role": response_message.role, "content": response_message.content})
    return (None, chat_history)


""" Functions"""


def web_search(
    aoai_client: AzureOpenAI,
    question: str,
    chat_history: List[Dict[str, str | List[ChatCompletionMessageToolCall]]],
    deploy_name: str,
    reasoning_effort: str | None = None,
):

    context_info = retrieve_context(
        aoai_client=aoai_client,
        deploy_name=deploy_name,
        chat_history=chat_history,
        question=question,
        current_date_time=get_current_date_time(),
        reasoning_effort=reasoning_effort,
    )

    generate_search_keywords_prompt = create_search_keyword_variation_prompt(
        question=question, chat_history=chat_history, context_info=context_info
    )

    with trace(
        user_id="test_user",
        llm_type="keyword_generation",
        input_value=generate_search_keywords_prompt,
        name="keyword_generation",
        metadata={"tags": TAG_GROUPS["KEYWORD_VARIATION"]},
    ) as rt:
        params = {
            "model": deploy_name,
            "messages": [
                {"role": "system", "content": generate_search_keywords_prompt},
            ],
            "tools": [{"type": "function", "function": VARIY_KEYWORDS_FUNCTION}],  # type: ignore
            "tool_choice": {
                "type": "function",
                "function": {"name": VARIY_KEYWORDS_FUNCTION["name"]},
            },  # type: ignore
        }

        if "reasoning_effort" in locals():
            params["reasoning_effort"] = reasoning_effort

        keyword_variation_response = aoai_client.chat.completions.create(**params)
        rt.output(output=keyword_variation_response)

    if keyword_variation_response.choices[0].message.tool_calls is not None:
        keywords = KeywordVariationResponse(
            **json.loads(keyword_variation_response.choices[0].message.tool_calls[0].function.arguments)
        )
        keywords_list = [keyword.keyword for keyword in keywords.keywords]

        concatenated_search_results = retireve_search_results_async(keywords_list=keywords_list)

        rerank_prompt = create_rerank_search_results_prompt(
            question=question,
            context_info=context_info,
            search_results=concatenated_search_results,
        )

        with trace(
            user_id="test_user",
            llm_type="rerank_search_results",
            input_value={"prompt": rerank_prompt},
            name="rerank_search_results",
            metadata={"tags": TAG_GROUPS["RERANK_SEARCH_RESULT"]},
        ) as rt:
            params = {
                "model": deploy_name,
                "messages": [
                    {"role": "system", "content": rerank_prompt},
                ],
                "tools": [{"type": "function", "function": RERANK_FUNCTION}],  # type: ignore
                "tool_choice": {
                    "type": "function",
                    "function": {"name": RERANK_FUNCTION["name"]},
                },  # type: ignore
            }

            if "reasoning_effort" in locals():
                params["reasoning_effort"] = reasoning_effort

            rerank_response = aoai_client.chat.completions.create(**params)
            rt.end(output=rerank_response)

        if rerank_response.choices[0].message.tool_calls is not None:
            rerank_response_content = RerankResponse(
                **json.loads(rerank_response.choices[0].message.tool_calls[0].function.arguments)
            )

            # ランク付けされた検索結果を取得
            formatted_search_results: List[Dict[str, int | str]] = rerank_response_content.format_search_result()

            return formatted_search_results

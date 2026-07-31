from typing import Dict, List

from openai import AzureOpenAI
from openai.types.chat import ChatCompletionMessageToolCall

from modules.logging.constants import TAG_GROUPS
from modules.logging.logger import trace

from .prompts.context_retriever import CONTEXT_RETRIEVER_PROMPT


def retrieve_context(
    aoai_client: AzureOpenAI,
    deploy_name: str,
    chat_history: List[Dict[str, str | List[ChatCompletionMessageToolCall]]],
    question: str,
    current_date_time: str,
    reasoning_effort: str | None = None,
) -> str:
    """
    チャット履歴、クエリ、および現在の時間に基づいてコンテキストを取得します。

    Args:
        aoai_client (AzureOpenAI): Azure OpenAI クライアントオブジェクト。
        deploy_name (str): 使用するモデルのデプロイ名。
        chat_history (str): 対話履歴。
        query (str): ユーザーからの質問やクエリ。
        current_date_time (str): 現在の時間。
        reasoning_effort (str | None): 推論の努力レベル。

    Returns:
        Dict[str, Any]: 取得されたコンテキスト情報。
    """

    chat_history_str = "\n".join([f"{message['role']}: {message['content']}" for message in chat_history])
    with trace(
        user_id="test_user",
        llm_type="context_retriever",
        input_value=question,
        name="context_retriever",
        metadata={"tags": TAG_GROUPS["RETRIEVE_CONTEXT"]},
    ) as rt:
        params = {
            "model": deploy_name,
            "messages": [
                {
                    "role": "system",
                    "content": CONTEXT_RETRIEVER_PROMPT.format(
                        chat_history=chat_history_str,
                        question=question,
                        current_date_time=current_date_time,
                    ),
                },
                {"role": "user", "content": question},
            ],
        }

        if "reasoning_effort" in locals():
            params["reasoning_effort"] = reasoning_effort

        response = aoai_client.chat.completions.create(**params)
        rt.end(output=response)
    context_output = response.choices[0].message.content

    if context_output is None:
        raise ValueError("context_output is None")
    return context_output

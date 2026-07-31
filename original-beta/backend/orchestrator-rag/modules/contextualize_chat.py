import logging
import os
import time

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

from modules.contextualize.contextualized_prompt import (
    get_contextualize_q_user_long_prompt,
)
from modules.contextualize.scheme import ContextualizedOutput

# Azure OpenAIのクライアントを初期化
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)
model_identifier = os.environ["MODEL_IDENTIFIER"]


def gen_contextualized_query(
    chat_history, question: str, model: str, reasoning_effort: str = None
):
    # instruction_prompt = get_contextualize_query_prompt(messages, question)
    start_time = time.time()
    input_tokens = 0
    output_tokens = 0

    azure_endpoint = os.environ["LOAD_BALANCER_ENDPOINT"]
    model = f"{model}-{model_identifier}"

    aoai_client = AzureOpenAI(
        azure_endpoint=azure_endpoint,
        azure_ad_token_provider=token_provider,
        api_version=os.environ["AZURE_OPENAI_VERSION"],
    )

    instruction_prompt = get_contextualize_q_user_long_prompt(chat_history, question)
    params = {
        "model": model,
        "messages": [
            {"role": "system", "content": instruction_prompt},
            {"role": "user", "content": question},
        ],
        "response_format": ContextualizedOutput,
    }

    if reasoning_effort is not None:
        params["reasoning_effort"] = reasoning_effort

    response = aoai_client.beta.chat.completions.parse(**params)

    usage = response.usage
    if usage:
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
    parsed_response = response.choices[0].message.parsed

    contexualizedQueryTime = round(time.time() - start_time, 3)

    if parsed_response is None:
        logging.error("failed to parse response")
        return question, contexualizedQueryTime, input_tokens, output_tokens
    else:
        logging.info(f"Parsed response: {parsed_response}")
        if (
            parsed_response.reformulated_query is None
            or parsed_response.reformulated_query == ""
        ):
            logging.error("reformulated_query is None or empty")
            return question, contexualizedQueryTime, input_tokens, output_tokens
        else:
            return (
                parsed_response.reformulated_query,
                contexualizedQueryTime,
                input_tokens,
                output_tokens,
            )

import json
import logging
import os
import time

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

# Azure OpenAIのクライアントを初期化
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")

# Azure OpenAIのオプション
model_identifier = os.environ["MODEL_IDENTIFIER"]


aoai_client = AzureOpenAI(
    azure_endpoint =os.environ["LOAD_BALANCER_ENDPOINT"],
    azure_ad_token_provider=token_provider,
    api_version=os.environ["AZURE_OPENAI_VERSION"],
)


def generate_thread_title(chat_history):
    start_time = time.time()
    input_tokens = 0
    output_tokens = 0
    if len(chat_history) <= 2:
        try:
            summary_prompt = {
                "role": "system",
                "content": (
                    "あなたは会話履歴を基にチャットのスレッドタイトルを生成するAIです。\n"
                    "ユーザが会話履歴を提示するので、条件に従ってタイトルを生成してください。\n\n"
                    "# 条件\n"
                    "- 日本語\n"
                    "- 15文字以内\n"
                    "- タイトル以外の余計なことは出力しない"
                ),
            }
            summary_messages = [
                summary_prompt,
                {"role": "user", "content": json.dumps(chat_history)},
            ]
            summary_completion = aoai_client.chat.completions.create(
                model=f"gpt-4.1-nano-{os.environ['MODEL_IDENTIFIER']}",
                messages=summary_messages,
            )
            thread_title = summary_completion.choices[0].message.content
            usage = summary_completion.usage
            if usage:
                input_tokens = usage.prompt_tokens
                output_tokens = usage.completion_tokens

        except Exception as e:
            logging.error(f"Error generating summary: {e}")
            thread_title = None  # 例外発生時にthread_titleをNoneに設定
    else:
        thread_title = None  # チャット履歴が1件以上の場合にデフォルト値を設定

    title_response_time = round(time.time() - start_time, 3)
    logging.info(f"スレッドタイトルの生成時間: {title_response_time}秒")
    return (thread_title, input_tokens, output_tokens, title_response_time)

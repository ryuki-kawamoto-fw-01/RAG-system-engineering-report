import json
import logging
import os

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI

# Azure OpenAIのクライアントを初期化
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

# Azure OpenAIのオプション
model_identifier = os.environ["MODEL_IDENTIFIER"]

aoai_client = AzureOpenAI(
    azure_endpoint=os.environ["LOAD_BALANCER_ENDPOINT"],
    azure_ad_token_provider=token_provider,
    api_version=os.environ["AZURE_OPENAI_VERSION"],
)


def generate_recommend(chat_history):
    logging.info(f"Chat History: {chat_history}")
    recommends = []
    try:
        summary_prompt = {
            "role": "system",
            "content": (
                "あなたは会話履歴を基にチャットのおすすめを生成するAIです。\n"
                "会話履歴を提示するので、会話の流れから、ユーザーが次に入力しそうな質問や発言例を3つ提案してください。\n"
                "会話内容をより深堀するためのヒントを提供してください。\n"
                "# 条件\n"
                "- 日本語\n"
                "- 40文字以内\n"
                "- 出力は**必ず**以下のJSON形式のみで返してください：\n"
                '{ "recommendations": ["生成したおすすめ1", "生成したおすすめ2", "生成したおすすめ3"] }'
            ),
        }
        summary_messages = [
            summary_prompt,
            {"role": "user", "content": json.dumps(chat_history)},
        ]
        summary_completion = aoai_client.chat.completions.create(
            model=f"gpt-4.1-nano-{os.environ['MODEL_IDENTIFIER']}",
            messages=summary_messages,
            temperature=0.5,
            response_format={"type": "json_object"},
        )
        recommend_json = summary_completion.choices[0].message.content
        if recommend_json:
            recommends = json.loads(recommend_json).get("recommendations", [])

    except json.JSONDecodeError as e:
        logging.error(f"Error parsing recommend JSON: {e}")
    except Exception as e:
        logging.error(f"Error recommend: {e}")

    return recommends
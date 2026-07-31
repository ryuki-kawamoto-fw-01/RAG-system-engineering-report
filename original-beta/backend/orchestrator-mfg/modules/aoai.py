import os
from typing import Dict, List

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI
from pydantic import BaseModel, Field


# responseフォーマットの指定
class CVEReportResponse(BaseModel):
    cve_chat: str = Field(..., description="チャット形式の回答")
    cve_report: str = Field(..., description="レポート")


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


# CVEチャット、レポート用
def create_aoai_answer(messages: List[Dict[str, str]]):
    model = f"gpt-5.2-{os.environ['MODEL_IDENTIFIER']}"

    completion = aoai_client.beta.chat.completions.parse(
        model=model,
        messages=messages,
        response_format=CVEReportResponse,
    )

    # 回答の取得
    cve_chat = completion.choices[0].message.parsed.cve_chat
    cve_report = completion.choices[0].message.parsed.cve_report

    return cve_chat, cve_report

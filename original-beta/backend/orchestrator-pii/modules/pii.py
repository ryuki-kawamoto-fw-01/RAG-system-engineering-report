import os

from azure.ai.textanalytics import TextAnalyticsClient
from azure.identity import DefaultAzureCredential


def create_analytics_client() -> TextAnalyticsClient:
    lang_endpoint = os.environ.get("LANGUAGE_ENDPOINT")

    if lang_endpoint is None:
        raise ValueError("エンドポイント(環境変数:LANGUAGE_ENDPOINT)が指定されていません")

    ta_credential = DefaultAzureCredential()
    return TextAnalyticsClient(endpoint=lang_endpoint, credential=ta_credential)

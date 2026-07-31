import logging
import os

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from openai import AzureOpenAI

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

search_client = SearchClient(
    endpoint=os.environ["AZURE_AISEARCH_ENDPOINT"],
    index_name=os.environ["AZURE_AISEARCH_INDEX_NAME"],
    credential=credential,
)

# Azure OpenAI クライアント（ベクトル化用）
aoai_client = AzureOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_EMBEDDING_ENDPOINT"],
    azure_ad_token_provider=token_provider,
    api_version=os.environ["AZURE_OPENAI_EMBEDDING_API_VERSION"],
)


class AISearchRepository:
    def _get_embedding(self, text: str) -> list[float]:
        """テキストをベクトル化（埋め込み）する"""
        try:
            response = aoai_client.embeddings.create(
                model=os.environ["AZURE_OPENAI_EMBEDDING_MODEL"],  # 環境変数から取得
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            logging.error(f"Embedding generation failed: {e}")
            raise

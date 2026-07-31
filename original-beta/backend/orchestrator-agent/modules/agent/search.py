import base64
import json
import logging
import os
from typing import List

from azure.ai.inference.models import UserMessage
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from azure.storage.blob import BlobServiceClient
from openai import AzureOpenAI
from pydantic import BaseModel, Field

from modules.agent.prompt import (
    TABLE_RECORD_JKS,
    TABLE_RECORD_TTS,
    get_table_search_prompt_jks,
    get_table_search_prompt_tts,
)

# インデックス用フィールド
DOCUMENT_CONTENT_FIELD = "chunk"
DOCUMENT_PATH_FIELD = "storage_file_path_name"
DOCUMENT_NAME_FIELD = "storage_blob_name"

def create_blob_service_client() -> BlobServiceClient:
    identity = DefaultAzureCredential()
    blob_conn_str = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
    return BlobServiceClient(account_url=blob_conn_str, credential=identity)


class Citation(BaseModel):
    search_title: str = Field(..., description="引用ドキュメントのタイトル")
    search_path: str = Field(..., description="引用ドキュメントのファイルパス")


class AISearchSegment(BaseModel):
    text: str = Field(..., description="引用を元に生成したテキスト")
    citation: List[Citation] = Field(..., description="引用ドキュメントのリスト")


class AISearchResponse(BaseModel):
    segments: List[AISearchSegment]


# 各ファイル情報の構造を定義
class TableSearchResponse(BaseModel):
    id: str = Field(..., description="ファイルID")
    document_number: str = Field(..., description="ドキュメント番号")
    category_code: str = Field(..., description="分類コード")
    category_name: str = Field(..., description="分類名")
    subcategory_code: str = Field(..., description="サブ分類コード")
    subcategory_name: str = Field(..., description="サブ分類名")
    description: str = Field(..., description="説明")


class TableSearchCombinedResponse(BaseModel):
    results: List[TableSearchResponse] = Field(..., description="関連ファイルの一覧")


def format_search_result(search_results) -> List[AISearchSegment]:
    segments = []
    for idx, result in enumerate(search_results, start=1):
        content = result[DOCUMENT_CONTENT_FIELD]
        title = base64.b64decode(result[DOCUMENT_NAME_FIELD]).decode("utf-8")
        logging.info("title%d: %s", idx, title)
        path = base64.b64decode(result[DOCUMENT_PATH_FIELD]).decode("utf-8")
        seg = AISearchSegment(text=content, citation=[Citation(search_title=title, search_path=path)])
        segments.append(seg)
    logging.info("Total files processed: %d", len(segments))
    return segments


class KeywordSearchTool:
    def __init__(self, search_client: SearchClient, aoai_client: AzureOpenAI, search_count=5, max_fetch_all=10):
        self.search_client = search_client
        self.aoai_client = aoai_client
        self.search_count = search_count
        self.max_fetch_all = max_fetch_all

    def keyword_search(self, query: str, desc: str, fetch_all: bool = True) -> str:
        """
        キーワード検索を行います。単純なキーワード検索ではなく高度な検索も可能です。

        :param query: 検索キーワードです。検索エンジンのキーワードをイメージしてください。キーワードは必ず1単語もしくは2単語までにしてください。例：「手順計画 規格」
        :param desc: ユーザーに説明するメッセージです。意図を説明してキーワード検索とqueryも明示して。queryは「」で囲って
        :param fetch_all: Trueの場合、キーワードを含む全ての文書（最大10件）を取得します。Falseの場合は上位5件を取得します。

        :return: キーワード検索の結果をJSON形式で出力
        :rtype: AISearchResponse
        """

        logging.info("fetch_all: %s", fetch_all)
        logging.info("query: %s", query)

        # キーワード検索
        search_options = {
            "select": [
                DOCUMENT_CONTENT_FIELD,
                DOCUMENT_PATH_FIELD,
                DOCUMENT_NAME_FIELD,
            ],
        }

        # fetch_all が True の場合、最大件数(10件)を取得する
        if fetch_all:
            search_options["top"] = self.max_fetch_all
        else:
            search_options["top"] = self.search_count

        # AND検索
        search_results = self.search_client.search(query, **search_options, search_mode="all")

        segments = format_search_result(search_results)

        return AISearchResponse(segments=segments).model_dump_json()


class SemanticSearchTool:
    DOCUMENT_VECTOR_FIELD = "vector"

    def __init__(
        self,
        semantic_config: str,
        embedding_model: str,
        search_client: SearchClient,
        aoai_client: AzureOpenAI,
        search_count: int = 3,
    ):
        self.search_client = search_client
        self.semantic_config = semantic_config
        self.embedding_model = embedding_model
        self.aoai_client = aoai_client
        self.search_count = search_count

    def semantic_search(self, query: str, desc: str) -> str:
        """
        検索クエリをベクトル空間に埋め込んで文書のベクトル群から意味の近い文書をk近傍法で選んで回答します。
        またBing検索で使われているセマンティックアルゴリズムも採用することで高度な検索を行います。

        :param query: 検索クエリ
        :param desc: ユーザーに説明するメッセージです。意図を説明してセマンティック検索とqueryも明示して。queryは「」で囲って

        :return: セマンティック検索の結果をJSON形式で出力
        :rtype: str
        """
        embedding_response = self.aoai_client.embeddings.create(
            input=[query],
            model=self.embedding_model,
        )
        embedding_vector = embedding_response.data[0].embedding
        vector_query = VectorizedQuery(
            vector=embedding_vector,
            k_nearest_neighbors=self.search_count,
            fields=self.DOCUMENT_VECTOR_FIELD,
        )

        # ハイブリットセマンティック検索
        search_options = {
            "top": self.search_count,
            "select": [
                DOCUMENT_CONTENT_FIELD,
                DOCUMENT_PATH_FIELD,
                DOCUMENT_NAME_FIELD,
            ],
        }
        search_results = self.search_client.search(
            query,
            **search_options,
            vector_queries=[vector_query],
            query_type="semantic",
            semantic_configuration_name=self.semantic_config,
        )

        segments = format_search_result(search_results)

        return AISearchResponse(segments=segments).model_dump_json()


# テーブル検索
# ユーザーの質問文から、テーブルレコード内で関連するファイルを特定し、ファイル情報を返す
class TableSearchTool:
    def __init__(self, client, model: str):
        """
        :param client: project_client.inference.get_chat_completions_client() で取得した LLM クライアント
        :param model: 利用するモデル名（例："gpt-5.2" など）
        """
        self.client = client
        self.model = model
        self.target_files = self._get_files(os.environ["TTS_FILE_PREFIX"]) + self._get_files(os.environ["JKS_FILE_PREFIX"])
        self.target_files = [x for x in self.target_files if ".keep" not in x]

    def table_search(self, query: str, desc: str) -> str:
        """
        テーブル検索を行います。
        ユーザーの質問（query）から、テーブルレコード内で関連するファイルを特定し、
        ファイルID、ドキュメント番号、分類コード、分類名、サブ分類コード、サブ分類名、説明を JSON 形式で返します。
        関連ファイルは該当する件数だけ返します。

        :param query: ユーザーの質問。例："図面の大きさについて教えて"
        :param desc: ユーザーに説明するメッセージです。意図を説明してテーブル検索とqueryも明示して。queryは「」で囲って
        :return: 取得結果をJson形式で出力。出力例:
        {
            "id": "1",
            "document_number": "TTS-DA-001",
            "category_code": "D",
            "category_name": "設計技術",
            "subcategory_code": "A",
            "subcategory_name": "機械製図（一般）",
            "description": "図面の大きさと様式に関する規格"
        },
        ...
        """

        # ログ出力：関数呼び出しの確認
        logging.info("table_search called with query: %s", query)

        # TTSに対するテーブル検索
        # LLMへ投げるプロンプトを構築
        prompt_tts = get_table_search_prompt_tts(query, TABLE_RECORD_TTS)

        # LLMにプロンプトを投げて回答を取得
        inference_client = self.client.inference.get_azure_openai_client(api_version="2024-12-01-preview")
        response = inference_client.beta.chat.completions.parse(
            model=self.model, messages=[UserMessage(content=prompt_tts)], response_format=TableSearchCombinedResponse
        )
        # LLMからメインファイルの回答を取得
        result_tts = json.loads(response.choices[0].message.content)

        # JKSに対するテーブル検索
        # LLMへ投げるプロンプトを構築
        prompt_jks = get_table_search_prompt_jks(query, TABLE_RECORD_JKS)

        # LLMにプロンプトを投げて回答を取得
        response = inference_client.beta.chat.completions.parse(
            model=self.model, messages=[UserMessage(content=prompt_jks)], response_format=TableSearchCombinedResponse
        )
        # LLMからメインファイルの回答を取得
        result_jks = json.loads(response.choices[0].message.content)

        # TTSとJKS両方の結果を結合
        combined_results = {"TTS": result_tts.get("results", []), "JKS": result_jks.get("results", [])}
        logging.info("combined_results: %s", combined_results)

        segments = []
        for item in combined_results["TTS"] + combined_results["JKS"]:
            # current 側の実装に合わせ、'filename' を優先して使用（もし無ければ document_number を代替）
            file_key = item.get("document_number")
            if file_key:
                file_path = self._get_filepath(file_key)
                if file_path:
                    # 対応するファイルのマークダウンコンテンツを取得
                    content = "\n".join(self._get_markdowns(file_path))
                    seg = AISearchSegment(
                        text=content,
                        citation=[
                            Citation(
                                search_title=os.path.basename(file_path),
                                search_path=file_path,
                            )
                        ],
                    )
                    segments.append(seg)
            else:
                logging.error(f"File {file_key} が見つかりません")
        logging.info("combined_results: %s", combined_results)
        return AISearchResponse(segments=segments).model_dump_json()

    def _get_filepath(self, key):
        matched = [x for x in self.target_files if key in os.path.basename(x)]
        if matched:
            return matched[0]
        return None

    def _get_files(self, prefix):
        blob_service_client = create_blob_service_client()
        src_container_env = os.environ["AZURE_STORAGE_SRC_CONTAINER"]
        src_client = blob_service_client.get_container_client(src_container_env)
        src_files = src_client.list_blobs(name_starts_with=prefix)
        return [x.name for x in src_files]

    def _get_markdowns(self, src_file_path: str) -> List[str]:
        """
        指定されたファイルに対応するパース済みのすべてのマークダウンコンテンツを取得します。

        :param src_file_path: 参照元のファイルパス
        :return: マークダウンテキストのリスト
        """
        blob_service_client = create_blob_service_client()
        dirname = os.path.dirname(src_file_path)
        base_name = os.path.splitext(os.path.basename(src_file_path))[0]
        markdown_prefix = f"{dirname}/{base_name}/{base_name}-"
        markdown_container_env = os.environ["AZURE_STORAGE_MARKDOWN_CONTAINER"]
        markdown_client = blob_service_client.get_container_client(markdown_container_env)
        markdown_files = markdown_client.list_blobs(name_starts_with=markdown_prefix)
        markdown_contents = []
        for blob in markdown_files:
            blob_client = markdown_client.get_blob_client(blob.name)
            if blob_client.exists():
                download_stream = blob_client.download_blob()
                content = download_stream.readall().decode("utf-8")
                markdown_contents.append(content)
        return markdown_contents

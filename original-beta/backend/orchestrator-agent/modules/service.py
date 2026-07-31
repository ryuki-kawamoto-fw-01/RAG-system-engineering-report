import base64
import logging
import os
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import requests
from azure.ai.agents.models import ToolSet
from azure.ai.inference.models import ChatCompletions
from azure.ai.projects import AIProjectClient
from azure.cosmos import ContainerProxy
from azure.storage.blob import BlobClient, BlobServiceClient

from modules.model import ChatResponse, Media, ToolCall, WordEntry
from modules.text.get_file_content import get_file_content


class ILLMService(ABC):
    """LLMサービスのインターフェース"""

    @abstractmethod
    def chat(
        self,
        messages: List[Dict[str, Any]],
        toolset: Optional[ToolSet] = None,
        retries: int = 5,
        interval: float = 1.2,
    ) -> ChatResponse:
        """LLMとのチャット対話を行う"""
        pass


class InferenceLLMService(ILLMService):
    def __init__(self, client: AIProjectClient, model: str):
        self.client = client.inference.get_chat_completions_client()
        self.model = model

    def chat(
        self,
        messages: List[Dict[str, Any]],
        toolset: Optional[ToolSet] = None,
        retries: int = 5,
        interval: float = 1.2,
    ) -> ChatResponse:
        for c in range(1, retries):
            try:
                response: ChatCompletions = self.client.complete(
                    model=self.model,
                    messages=messages,
                    tools=toolset.definitions if toolset else None,  # type: ignore
                )
                message = response.choices[0]["message"]
                result = {"content": message["content"]}
                if message.get("tool_calls"):
                    result["tool_calls"] = [t.as_dict() for t in message["tool_calls"]]
                else:
                    result["tool_calls"] = []
                return result
            except Exception as e:
                logging.error(f"Error: {e}", exc_info=True)
                time.sleep(int(interval * retries))
                if c == retries:
                    raise e
            logging.info(messages)
        raise Exception("LLMの呼び出しが最大リトライ回数に達しました")


class IStorageService(ABC):
    """ストレージサービスのインターフェース"""

    @abstractmethod
    def list_files(self, prefix: str) -> List[str]:
        """指定されたプレフィックスを持つファイル一覧を取得する"""
        pass

    @abstractmethod
    def read_file(self, filepath: str) -> bytes:
        """ファイルを読み込む"""
        pass

    @abstractmethod
    def fetch_media(self, file_name: str, media_type: str) -> Media:
        """ファイルの内容を取得してMediaオブジェクトを返す"""
        pass

    @abstractmethod
    def fetch_media_from_url(self, file_url: str, media_type: str) -> Media:
        """URLからファイルの内容を取得してMediaオブジェクトを返す"""
        pass


class AzureStorageService(IStorageService):
    def __init__(self, credential, connection_string: str, container_name: str):
        self.blob_service_client = BlobServiceClient(account_url=connection_string, credential=credential)
        self.container_client = self.blob_service_client.get_container_client(container_name)

    def list_files(self, prefix: str) -> List[str]:
        src_files = self.container_client.list_blobs(name_starts_with=prefix)
        return [src_file.name for src_file in src_files]

    def read_file(self, filepath) -> bytes:
        logging.info(f"Reading blob: '{filepath}'")
        blob_client: BlobClient = self.container_client.get_blob_client(blob=filepath)
        blob_data = blob_client.download_blob().readall()
        return blob_data

    def fetch_media(self, file_name: str, media_type: str) -> Media:
        """
        ファイルの内容を取得してMediaオブジェクトを返す

        Args:
            file_name: ファイル名
            media_type: メディアタイプ

        Returns:
            Media: 処理されたメディアコンテンツ
        """
        if not file_name or not media_type:
            return Media(file_name=file_name, media_type=media_type)

        try:
            blob_data = self.read_file(file_name)
        except Exception as e:
            logging.error(f"Failed to read file '{file_name}': {str(e)}")
            # ファイル読み込みに失敗した場合は、空のMediaオブジェクトを返す
            return Media(file_name=file_name, media_type=media_type)

        media = Media(file_name=file_name, media_type=media_type)

        if "image" in media_type:
            # 画像ファイルの処理
            image_content = base64.encodebytes(blob_data).decode("utf-8")
            media.image_url = f"data:{media_type};base64,{image_content}"
        else:
            # その他のファイル（テキスト等）の処理
            file_content = base64.encodebytes(blob_data).decode("utf-8")
            file_extension = os.path.splitext(file_name)[1].replace(".", "")
            processed_content = get_file_content(file_content, file_extension)
            media.file_content = processed_content

        return media

    def fetch_media_from_url(self, file_url: str, media_type: str) -> Media:
        """
        URLからファイルの内容を取得してMediaオブジェクトを返す

        Args:
            file_url: ファイルのURL
            media_type: メディアタイプ

        Returns:
            Media: 処理されたメディアコンテンツ
        """
        if not file_url or not media_type:
            return Media(file_name="", media_type=media_type)

        try:
            # URLからファイルをダウンロード
            response = requests.get(file_url, timeout=30)
            response.raise_for_status()
            blob_data = response.content
        except Exception as e:
            logging.error(f"Failed to fetch file from URL '{file_url}': {str(e)}")
            return Media(file_name="", media_type=media_type)

        # ファイル名をURLから抽出（最後のパス部分）
        file_name = file_url.split("/")[-1].split("?")[0]
        media = Media(file_name=file_name, media_type=media_type)

        if "image" in media_type:
            # 画像ファイルの処理
            image_content = base64.encodebytes(blob_data).decode("utf-8")
            media.image_url = f"data:{media_type};base64,{image_content}"
        else:
            # その他のファイル（テキスト等）の処理
            file_content = base64.encodebytes(blob_data).decode("utf-8")
            file_extension = os.path.splitext(file_name)[1].replace(".", "")
            processed_content = get_file_content(file_content, file_extension)
            media.file_content = processed_content

        return media


class IWordDictionaryService(ABC):
    """辞書サービスのインターフェース"""

    @abstractmethod
    def get_words(self) -> List[WordEntry]:
        """辞書データを取得する"""
        pass


class CosmosDBWordDictionaryService(IWordDictionaryService):
    def __init__(self, container: ContainerProxy):
        self.container = container

    def get_words(self) -> List[WordEntry]:
        start_time = time.time()
        query = f"SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)"
        end_time = time.time()
        read_db_loading_time = round(end_time - start_time, 3)
        logging.info(f"Read CosmosDB time: {read_db_loading_time} seconds")
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        # 取得したアイテムをWordDictionary型に変換し、無効なエントリはスキップ
        valid_dictionaries = []
        for item in items:
            try:
                # Pydanticでバリデーション
                word_dict = WordEntry(
                    terms=item.get("terms", ""),
                    uniform_name=item.get("uniform_name", ""),
                    description=item.get("description", ""),
                )
                valid_dictionaries.append(word_dict)
            except Exception as e:
                logging.warning(f"無効な辞書エントリをスキップします: {item.get('id', 'unknown')}. エラー: {str(e)}")
                continue
        return valid_dictionaries


class AzureInferenceLLMService(ILLMService):
    def __init__(self, client: AIProjectClient, model: str):
        self.client = client.inference.get_azure_openai_client(api_version="2024-12-01-preview")
        self.model = model

    def chat(
        self,
        messages: List[Dict[str, Any]],
        toolset: Optional[ToolSet] = None,
        retries: int = 5,
        interval: float = 1.2,
    ) -> ChatResponse:
        for c in range(1, retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,  # type: ignore
                    tools=toolset.definitions if toolset else None,  # type: ignore
                )
                message = response.choices[0].message
                result = {"content": message.content}

                if message.tool_calls:
                    tool_calls: List[ToolCall] = []
                    for tc in message.tool_calls:
                        tool_calls.append(
                            {
                                "id": tc.id,
                                "type": tc.type,
                                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                            }
                        )
                    result["tool_calls"] = tool_calls
                else:
                    result["tool_calls"] = []

                return result
            except Exception as e:
                logging.error(f"Error: {e}", exc_info=True)
                time.sleep(int(interval * retries))
                if c == retries:
                    raise e
            logging.info(messages)
        raise Exception("LLMの呼び出しが最大リトライ回数に達しました")

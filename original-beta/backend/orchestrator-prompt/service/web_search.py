# import os

import asyncio
import html
from typing import Any
from typing import Dict, Union

from repository.bing_search import BingSearchRepository


class WebSearchService:
    def __init__(self, bingSearchRepository: BingSearchRepository):
        self.bingSearchRepository = bingSearchRepository

    # 検索結果をフォーマットする関数
    def format_search_result(
        self, result: dict[str, Any], idx: int
    ) -> Dict[str, Union[str, int]]:
        """
        Args: result (dict): 検索結果の1単位
              idx (int): 検索結果のインデックス
        Returns: dict: フォーマットされた検索結果
        """
        title = result["name"]
        url = result["url"]
        snippet = html.unescape(result["snippet"])  # HTMLエンティティをデコード
        return {"id": idx + 1, "title": title, "url": url, "snippet": snippet}

    # Wikipediaの結果を検索結果から除外する関数
    def exclude_wikipedia(self, search_results: dict[str, Any]) -> list[dict[str, str]]:
        """
        Args: search_results (dict): Azure Bing Search APIからの検索結果
        Returns: list: Wikipediaの結果を除外した検索結果のリスト
        Notes: WikipediaのURLに"wikipedia.org"が含まれる場合は除外する
               信頼性の高い情報を提供するため
        """
        filtered_results: list[dict[str, Any]] = []
        if "webPages" in search_results and "value" in search_results["webPages"]:
            for result in search_results["webPages"]["value"]:
                if "wikipedia.org" not in result["url"]:
                    filtered_results.append(result)
        return filtered_results

    # フィルタリングされた検索結果を前処理する関数
    def preprocess_search_results(
        self, filtered_results: list[dict[str, Any]], max_results: int = 5
    ):
        """
        Args: filtered_results (list): フィルタリングされた検索結果
              max_results (int): 返す結果の最大数 デフォルトは5
        Returns: list: フォーマットされた検索結果のリスト(結果が見つからない場合はデフォルトのメッセージを含む)
        """
        formatted_search_results: list[dict[str, str | int]] = []
        for idx, result in enumerate(filtered_results):
            formatted_result = self.format_search_result(result, idx)
            formatted_search_results.append(formatted_result)
            if len(formatted_search_results) == max_results:
                break

        if not formatted_search_results:
            # 検索結果が存在しない場合にデフォルトのメッセージを追加
            formatted_search_results.append(
                {
                    "id": 1,
                    "title": "No results found",
                    "url": "No results found",
                    "snippet": "No results found",
                }
            )

        return formatted_search_results

    # 指定されたキーワードでWeb検索を行い、結果をフォーマットして返す関数
    def retrieve_search_results(self, keyword: str):
        """
        Args: keyword (str): 検索キーワード
        Returns: str: フォーマットされた検索結果の文字列
        """
        search_results = self.bingSearchRepository.search_bing(keyword)
        filtered_results = self.exclude_wikipedia(search_results)
        formatted_search_results = self.preprocess_search_results(filtered_results)

        # 検索結果をフォーマットして結合する
        # 各検索結果を "title", "url", "snippet" の形式で文字列に変換し、
        # それらを "\n\n" で区切って一つの文字列に結合する（システムメッセージ内でLLMが認識しやすくするため）
        return "\n\n".join(
            [
                f"title: {result['title']}\nurl: {result['url']}\nsnippet: {result['snippet']}"
                for result in formatted_search_results
            ]
        )

    """非同期処理"""

    # Azure Bing Search APIを使用してWeb検索を行う関数
    async def search_bing_async(self, query: str):
        """
        Args: query (str): 検索クエリ
        Returns: dict: Azure Bing Search APIからの検索結果
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.retrieve_search_results, query)

    # 指定されたキーワードでWeb検索を行い、結果をフォーマットして返す関数
    async def search_keywords_async(self, keywords: list[str]):
        """
        Args: keywords (list): 検索キーワードのリスト
        Returns: str: フォーマットされた検索結果の文字列
        """

        tasks = [self.search_bing_async(keyword) for keyword in keywords]
        return await asyncio.gather(*tasks)

    #  指定されたキーワードでWeb検索を行い、結果をフォーマットして返す関数
    def retrieve_search_results_async(self, keywords_list: list[str]):
        """
        Args: keywords_list (List): 検索キーワードのリスト
        Returns: str: フォーマットされた検索結果の文字列
        """
        search_results = asyncio.run(self.search_keywords_async(keywords_list))

        concatenated_search_results = ""

        for result in search_results:
            concatenated_search_results += result

        return concatenated_search_results

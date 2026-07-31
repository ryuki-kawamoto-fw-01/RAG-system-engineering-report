import asyncio
import html
import os
from typing import Any, List

import requests


def search_bing(query: str) -> dict[str, str]:
    """Azure Bing Search APIを使用してWeb検索を行う関数

    Args:
        query (str): 検索クエリ

    Returns:
        dict: Azure Bing Search APIからの検索結果
    """
    subscription_key = os.environ["BING_SEARCH_API_KEY"]
    search_url = os.environ["BING_SEARCH_ENDPOINT"].rstrip("/") + "/v7.0/search"

    headers = {"Ocp-Apim-Subscription-Key": subscription_key}
    params = {
        "q": query,
        "count": 10,  # 10件の検索結果を取得
        "offset": 0,  # 1ページ目の結果を取得
        "mkt": "ja-JP",  # 日本語の検索結果を取得
        "safeSearch": "Moderate",  # モデレートなコンテンツを表示(不適切なコンテンツを除外)
        "responseFilter": ["Webpages", "News"],  # Webページの検索結果を取得
        "textDecorations": True,  # 検索結果にハイライトを表示
        "textFormat": "HTML",  # 検索結果をHTML形式で取得
        "sortBy": "Date",  # 検索結果を日付順にソート
    }
    response = requests.get(search_url, headers=headers, params=params)
    response.raise_for_status()
    search_results = response.json()
    return search_results


def format_search_result(result: dict[str, Any], idx: int) -> dict[str, str | int]:
    """検索結果をフォーマットする関数

    Args:
        result (dict): 検索結果の1単位
        idx (int): 検索結果のインデックス

    Returns:
        dict: フォーマットされた検索結果
    """
    title = result["name"]
    url = result["url"]
    snippet = html.unescape(result["snippet"])  # HTMLエンティティをデコード
    return {"id": idx + 1, "title": title, "url": url, "snippet": snippet}


def enclude_wikipedia(search_results: dict[str, Any]) -> list[dict[str, str]]:
    """Wikipediaの結果を検索結果から除外する関数

    Args:
        search_results (dict): Azure Bing Search APIからの検索結果

    Returns:
        list: Wikipediaの結果を除外した検索結果のリスト

    Notes:
        WikipediaのURLに"wikipedia.org"が含まれる場合は除外する
        信頼性の高い情報を提供するため
    """
    filtered_results: list[dict[str, Any]] = []
    if "webPages" in search_results and "value" in search_results["webPages"]:
        for result in search_results["webPages"]["value"]:
            if "wikipedia.org" not in result["url"]:
                filtered_results.append(result)
    return filtered_results


def preprocess_search_results(
    filtered_results: list[dict[str, Any]], max_results: int = 5
):
    """フィルタリングされた検索結果を前処理する関数

    Args:
        filtered_results (list): フィルタリングされた検索結果
        max_results (int): 返す結果の最大数 デフォルトは5

    Returns:
        list: フォーマットされた検索結果のリスト(結果が見つからない場合はデフォルトのメッセージを含む)
    """
    formatted_search_results: list[dict[str, str | int]] = []
    for idx, result in enumerate(filtered_results):
        formatted_result = format_search_result(result, idx)
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


def retireve_search_results(keyword: str):
    """
    指定されたキーワードでWeb検索を行い、結果をフォーマットして返す関数

    Args:
        keyword (str): 検索キーワード

    Returns:
        str: フォーマットされた検索結果の文字列
    """
    search_results = search_bing(keyword)
    filtered_results = enclude_wikipedia(search_results)
    formatted_search_results = preprocess_search_results(filtered_results)

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


async def search_bing_async(query: str):
    """Azure Bing Search APIを使用してWeb検索を行う関数

    Args:
        query (str): 検索クエリ

    Returns:
        dict: Azure Bing Search APIからの検索結果
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, retireve_search_results, query)


async def search_keywords_async(keywords: list[str]):
    """
    指定されたキーワードでWeb検索を行い、結果をフォーマットして返す関数

    Args:
        keywords (list): 検索キーワードのリスト

    Returns:
        str: フォーマットされた検索結果の文字列
    """

    tasks = [search_bing_async(keyword) for keyword in keywords]
    return await asyncio.gather(*tasks)


def retireve_search_results_async(keywords_list: List[str]):
    """
    指定されたキーワードでWeb検索を行い、結果をフォーマットして返す関数

    Args:
        keywords_list (List): 検索キーワードのリスト

    Returns:
        str: フォーマットされた検索結果の文字列
    """
    search_results = asyncio.run(search_keywords_async(keywords_list))

    concated_search_results = ""

    for result in search_results:
        concated_search_results += result

    return concated_search_results

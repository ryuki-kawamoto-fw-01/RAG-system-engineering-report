import os

import requests


class BingSearchRepository:
    def search_bing(self, query: str) -> dict[str, str]:
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
        return response.json()

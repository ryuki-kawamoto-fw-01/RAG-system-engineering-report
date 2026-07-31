import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_comparison import ProductComparisonPostRequest
from system.comparison import get_comparison_message


class ProductComparisonService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ProductComparisonPostRequest:
        req_body = self.request.get_json()
        products = req_body.get("products")
        purpose = req_body.get("purpose")
        considerations = req_body.get("considerations")

        params = ProductComparisonPostRequest(
            products=products,
            purpose=purpose,
            considerations=considerations,
        )
        logging.info(f"Request body: {params}")

        return params

    def compare(self):
        # リクエストボディからパラメータを取得
        params = self.body_parser()

        # プロンプト生成（表形式JSONで返すよう指示済み）
        prompt_messages = get_comparison_message(
            products=params.products,
            purpose=params.purpose,
            considerations=params.considerations,
        )

        # Azure OpenAIを使用して製品比較を実行
        answer = self.repository.parse_aoai_answer_product_comparison(prompt_messages)

        # 返却データを表形式JSONとして返す
        response_data = {"table": answer}
        return response_data

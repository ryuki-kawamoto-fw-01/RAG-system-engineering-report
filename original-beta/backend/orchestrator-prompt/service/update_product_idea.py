import html
import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.product_idea import ProductIdeaUpdateRequest
from system.update_product_idea import get_update_product_idea_system_message


class UpdateProductIdeaService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> dict:
        req_body = self.request.get_json()
        product_idea = req_body.get("productIdea")
        user_chat = req_body.get("chat")
        chat_history_dict = req_body.get("chatHistory")
        if chat_history_dict:
            # chat_historyの最後の要素とchatの内容が同じ場合、重複しないようにchatHistoryの末尾の要素は削除してシステムメッセージに渡す
            value = chat_history_dict[-1].get("chat")
            if user_chat == value:
                chat_history_dict.pop()
            # もしリストの要素が6つより多い（履歴が3往復より多い）場合は6つになるまで古いものを消していく
            while len(chat_history_dict) > 6:
                chat_history_dict.pop(0)
            # システムメッセージに渡すために形式を変換
            chat_history = [{item["role"]: item["chat"]} for item in chat_history_dict]
        else:
            chat_history = []

        params = ProductIdeaUpdateRequest(
            productIdea=product_idea,
            userChat=user_chat,
            chatHistory=chat_history,
        )
        return params

    def post_update_product_idea(self) -> dict:
        # 元のアイデアの取得
        product_idea = self.body_parser().productIdea
        # ユーザの要望の取得
        user_chat = self.body_parser().userChat
        # チャット履歴の取得
        chat_history = self.body_parser().chatHistory

        logging.info(
            f"UpdateProductIdeaService: product_idea={product_idea}, user_chat={user_chat}, chat_history={chat_history}"
        )

        # システムメッセージの作成
        message = get_update_product_idea_system_message(
            product_idea=product_idea,
            user_request=user_chat,
            chat_history=chat_history,
        )

        # モデルの呼び出し
        answer, idea = self.repository.parse_aoai_answer_product_idea(message)

        # \nの改行を<br/>に変換
        answer = html.escape(answer)
        answer = answer.replace("\n", "<br/>")

        response_data = {
            "content": idea,
            "chat": answer,
            "success": True,
        }
        return response_data

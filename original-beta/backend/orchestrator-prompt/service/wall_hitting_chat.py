import json

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.wall_hitting import WallHittingChatPostRequest
from system.wall_hitting import get_wall_hitting_chat_message


class WallHittingChatService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self):
        form = self.request.form
        question = form.get("question")
        chat_history_raw = form.get("chatHistory", "[]")
        try:
            chat_history = json.loads(chat_history_raw)
        except Exception:
            chat_history = []
        params = WallHittingChatPostRequest(question=question, chatHistory=chat_history)
        return params.question, [msg.model_dump() for msg in params.chatHistory]

    def post_wall_hitting_chat(self):
        question, chat_history = self.body_parser()
        messages = get_wall_hitting_chat_message(question, chat_history)
        answer = self.repository.create_aoai_answer(messages)
        return {"success": True, "data": {"content": answer}}

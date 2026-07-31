import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.wall_hitting import WallHittingPostRequest
from system.wall_hitting import get_wall_hitting_message


class WallHittingService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> WallHittingPostRequest:
        req_body = self.request.get_json()
        theme = req_body.get("theme")
        idea = req_body.get("idea")

        params = WallHittingPostRequest(
            theme=theme,
            idea=idea,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_wall_hitting(self):
        theme = self.body_parser().theme
        idea = self.body_parser().idea

        answer = self.repository.create_aoai_answer(
            get_wall_hitting_message(
                theme,
                idea,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

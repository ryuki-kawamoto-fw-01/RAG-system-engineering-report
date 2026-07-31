import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.prompt import FixPromptPostRequest
from system.fix_prompt import get_revision_message


class FixPromptService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> FixPromptPostRequest:
        req_body = self.request.get_json()
        revisionPrompt = req_body.get("revisionPrompt")
        enhancedPrompt = req_body.get("enhancedPrompt")

        params = FixPromptPostRequest(
            revisionPrompt=revisionPrompt,
            enhancedPrompt=enhancedPrompt,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_fix_prompt(self):
        revision_prompt = self.body_parser().revisionPrompt
        enhanced_prompt = self.body_parser().enhancedPrompt

        answer = self.repository.create_aoai_answer(
            get_revision_message(revision_prompt, enhanced_prompt)
        )

        response_data = {"answer": answer}

        return response_data

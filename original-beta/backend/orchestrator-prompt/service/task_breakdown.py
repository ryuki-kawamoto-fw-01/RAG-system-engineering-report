import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.task_breakdown import FixTaskBreakdownRequest, TaskBreakdownRequest
from system.task_breakdown import get_fix_user_message, get_user_message


# 新規作成
class TaskBreakdownService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> TaskBreakdownRequest:
        req_body = self.request.get_json()
        task = req_body.get("task")
        consideration = req_body.get("consideration", "")

        params = TaskBreakdownRequest(
            task=task,
            consideration=consideration,
        )

        logging.info(f"Request body: {params}")
        return params

    def post_task_breakdown(self):
        try:
            task = self.body_parser().task
            consideration = self.body_parser().consideration

            answer = self.repository.create_aoai_answer_reasoning(
                get_user_message(
                    task,
                    consideration,
                )
            )
            response_data = {"answer": answer, "success": True}
        except Exception as e:
            response_data = {"answer": None, "success": False, "message": str(e)}
        return response_data


# 結果調整
class FixTaskBreakdownService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> FixTaskBreakdownRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        revisionPrompt = req_body.get("revisionPrompt")

        params = FixTaskBreakdownRequest(
            result=result,
            revisionPrompt=revisionPrompt,
        )

        logging.info(f"Request body: {params}")
        return params

    def post_fix_task_breakdown(self):
        try:
            result = self.body_parser().result
            revisionPrompt = self.body_parser().revisionPrompt

            answer = self.repository.create_aoai_answer_reasoning(
                get_fix_user_message(
                    result,
                    revisionPrompt,
                )
            )

            response_data = {"answer": answer, "success": True}
        except Exception as e:
            response_data = {"answer": None, "success": False, "message": str(e)}
        return response_data

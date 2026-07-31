import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.schedule import SchedulePostRequest
from system.schedule import get_schedule_message


class ScheduleService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> SchedulePostRequest:
        req_body = self.request.get_json()
        newSchedulework = req_body.get("newSchedulework")
        newSchedulestartdate = req_body.get("newSchedulestartdate")
        newScheduleenddate = req_body.get("newScheduleenddate")
        newScheduleConsiderations = req_body.get("newScheduleConsiderations", "")

        params = SchedulePostRequest(
            newSchedulework=newSchedulework,
            newSchedulestartdate=newSchedulestartdate,
            newScheduleenddate=newScheduleenddate,
            newScheduleConsiderations=newScheduleConsiderations,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_schedule(self):
        newSchedulework = self.body_parser().newSchedulework
        newSchedulestartdate = self.body_parser().newSchedulestartdate
        newScheduleenddate = self.body_parser().newScheduleenddate
        newScheduleConsiderations = self.body_parser().newScheduleConsiderations

        answer = self.repository.create_aoai_answer(
            get_schedule_message(
                newSchedulework,
                newSchedulestartdate,
                newScheduleenddate,
                newScheduleConsiderations,
            )
        )

        response_data = {"answer": answer, "success": True}

        return response_data

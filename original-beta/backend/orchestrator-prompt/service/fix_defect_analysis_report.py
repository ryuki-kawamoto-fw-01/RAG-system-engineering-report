import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.defect_analysis_report import DefectAnalysisReportFixRequest
from system.defect_analysis_report import get_fix_defect_analysis_report_message


class FixDefectAnalysisReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> DefectAnalysisReportFixRequest:
        form = self.request.form

        result = form.get("result")
        modify = form.get("modify")

        params = DefectAnalysisReportFixRequest(
            result=result,
            modify=modify,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_fix_defect_analysis_report(self):
        params = self.form_parser()

        result = params.result
        modify = params.modify

        fixed_content = self.repository.create_aoai_answer(
            get_fix_defect_analysis_report_message(result, modify)
        )

        return {"content": fixed_content}

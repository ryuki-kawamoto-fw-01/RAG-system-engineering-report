import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.defect_analysis_report import DefectAnalysisReportPostRequest
from system.defect_analysis_report import get_defect_analysis_report_message


class DefectAnalysisReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> DefectAnalysisReportPostRequest:
        form = self.request.form

        productName: str = form.get("productName")
        defectDescription: str = form.get("defectDescription")
        occurenceCondition: str = form.get("occurenceCondition")
        usageEnvironment: str = form.get("usageEnvironment")
        impactScope: str = form.get("impactScope")
        defectData: str = form.get("defectData")
        consideration: str = form.get("consideration")

        params = DefectAnalysisReportPostRequest(
            productName=productName,
            defectDescription=defectDescription,
            occurenceCondition=occurenceCondition,
            usageEnvironment=usageEnvironment,
            impactScope=impactScope,
            defectData=defectData,
            consideration=consideration,
        )
        logging.info(f"Request form: {params}")
        return params

    def post_defect_analysis_report(self):
        params = self.form_parser()

        product_name = params.productName
        defect_description = params.defectDescription
        occurence_condition = params.occurenceCondition
        usage_environment = params.usageEnvironment
        impact_scope = params.impactScope
        defect_data = params.defectData
        consideration = params.consideration

        messages = get_defect_analysis_report_message(
            product_name,
            defect_description,
            occurence_condition,
            usage_environment,
            impact_scope,
            defect_data,
            consideration,
        )

        content = self.repository.create_aoai_answer(messages)

        return {"content": content}

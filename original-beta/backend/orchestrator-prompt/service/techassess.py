import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.techassess import TechassessPostRequest
from system.techassess import get_techassess_report_message


class TechassessService:
    def __init__(
        self,
        aoaiRepository: AoaiRepository,
        request: func.HttpRequest,
    ):
        self.aoaiRepository = aoaiRepository
        self.request = request

    def body_parser(self) -> TechassessPostRequest:
        req_body = self.request.get_json()
        field = req_body.get("field")
        region = req_body.get("region")
        company_size = req_body.get("companySize")
        industry_issues = req_body.get("industryIssues")
        granularity = req_body.get("granularity")
        purpose = req_body.get("purpose")
        target_company = req_body.get("targetCompany", "")
        additional_information = req_body.get("additionalInformation", "")

        params = TechassessPostRequest(
            field=field,
            region=region,
            companySize=company_size,
            industryIssues=industry_issues,
            granularity=granularity,
            purpose=purpose,
            targetCompany=target_company,
            additionalInformation=additional_information,
        )
        logging.info(f"Request body: {params}")
        return params

    def process_techassess_report(self):
        params = self.body_parser()
        techassess_message = get_techassess_report_message(
            {
                "field": params.field,
                "region": params.region,
                "companySize": params.companySize,
                "industryIssues": params.industryIssues,
                "granularity": params.granularity,
                "purpose": params.purpose,
            }
        )

        # 技術報告レポート用のメソッド呼び出し
        report = self.aoaiRepository.get_techassess_report(techassess_message)

        logging.info(f"Got techassess report: {report}")

        return {
            "results": report,
            "success": True,
        }

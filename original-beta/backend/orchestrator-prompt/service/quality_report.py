import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.quality_report import QualityReportPostRequest
from system.quality_report import get_quality_report_message


class QualityReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def json_parser(self) -> QualityReportPostRequest:
        """JSONリクエストボディをパース"""
        try:
            req_body = self.request.get_json()
            if not req_body:
                raise ValueError("リクエストボディが空です")

            params = QualityReportPostRequest(**req_body)
            logging.info(f"Request JSON: {params}")
            return params
        except Exception as e:
            logging.error(f"JSON parsing error: {str(e)}")
            raise

    def post_quality_report(self):
        """品質保証レポートを生成"""
        params = self.json_parser()

        # システムメッセージの生成
        system_message = get_quality_report_message(
            company_name=params.company_name,
            manufacturing_type=params.manufacturing_type,
            current_process_overview=params.current_process_overview,
            quality_data_management=params.quality_data_management,
            quality_history_data=params.quality_history_data,
            quality_issues=params.quality_issues,
            analysis_period=params.analysis_period,
            improvement_goals=params.improvement_goals,
            evaluation_metrics=params.evaluation_metrics,
            additional_considerations=params.additional_considerations,
            report_detail_level=params.report_detail_level,
        )

        # AI回答の生成
        answer = self.repository.create_aoai_answer(system_message)

        # レスポンスデータの作成
        response_data = {
            "report": answer,
            "company_name": params.company_name,
            "manufacturing_type": params.manufacturing_type,
            "report_detail_level": params.report_detail_level,
            "success": True,
        }

        return response_data

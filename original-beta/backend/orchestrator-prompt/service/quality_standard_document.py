import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.quality_standard_document import QualityStandardDocumentRequest
from system.quality_standard_document import get_quality_standard_document_message


class QualityStandardDocumentService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> QualityStandardDocumentRequest:
        """JSONリクエストボディをパース"""
        try:
            req_body = self.request.get_json()
            if not req_body:
                raise ValueError("リクエストボディが空です")

            params = QualityStandardDocumentRequest(**req_body)
            logging.info(f"Request JSON: {params}")
            return params
        except Exception as e:
            logging.error(f"JSON parsing error: {str(e)}")
            raise

    def post_quality_standard_document(self):
        """品質基準書を生成"""
        # リクエストパラメータの取得
        params = self.body_parser()

        # システムメッセージの生成
        system_message = get_quality_standard_document_message(
            product_name=params.product_name,
            manufacturing_type=params.manufacturing_type,
            applicable_regulations=params.applicable_regulations,
            product_specifications=params.product_specifications,
            tolerance_requirements=params.tolerance_requirements,
            document_detail_level=params.document_detail_level,
            quality_characteristics=params.quality_characteristics,
            existing_inspection_methods=params.existing_inspection_methods,
            additional_considerations=params.additional_considerations,
        )

        # OpenAI APIを呼び出して品質基準書を生成
        answer = self.repository.create_aoai_answer(system_message)

        # レスポンスデータの作成
        response_data = {
            "content": answer,
            "success": True,
        }

        return response_data

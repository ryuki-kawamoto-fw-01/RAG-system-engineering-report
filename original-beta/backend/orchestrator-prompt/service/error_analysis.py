import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.error_analysis import ErrorAnalysisPostRequest, ErrorAnalysisPostResponse
from system.error_analysis import get_error_analysis_message


class ErrorAnalysisService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> ErrorAnalysisPostRequest:
        try:
            req_body = self.request.get_json()
            if not req_body:
                raise ValueError("JSONデータが提供されていません")

            programmingLanguage = req_body.get("programmingLanguage")
            errorMessage = req_body.get("errorMessage")
            considerations = req_body.get("considerations")

            params = ErrorAnalysisPostRequest(
                programmingLanguage=programmingLanguage,
                errorMessage=errorMessage,
                considerations=considerations,
            )
            logging.info(f"Request body: {params}")
            return params
        except Exception as e:
            logging.error(f"JSON parsing error: {e}")
            raise e

    def post_error_analysis(self) -> dict:
        try:
            body_data = self.body_parser()

            system_message = get_error_analysis_message(
                programming_language=body_data.programmingLanguage,
                error_message=body_data.errorMessage,
                considerations=body_data.considerations,
            )

            logging.info(f"System message: {system_message}")

            content = self.repository.create_aoai_answer(
                messages=[{"role": "system", "content": system_message}]
            )

            explanation, solutionAndExample = self._parse_response(content)

            result = ErrorAnalysisPostResponse(
                explanation=explanation,
                solutionAndExample=solutionAndExample,
                success=True,
            )

            logging.info(f"Response: {result}")
            return result.model_dump()

        except Exception as e:
            logging.error(f"Error in post_error_analysis: {e}")
            raise e

    def _parse_response(self, content: str) -> tuple[str, str]:
        explanation = ""
        solutionAndExample = ""

        lines = content.split("\n")
        current_section = "explanation"

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if "解決策" in line or "Solution" in line or "対処法" in line:
                current_section = "solutionAndExample"
                continue

            if current_section == "explanation":
                explanation += line + "\n"
            elif current_section == "solutionAndExample":
                solutionAndExample += line + "\n"

        if not solutionAndExample:
            explanation = content
            solutionAndExample = "上記の解説を参考に修正してください。"

        return explanation.strip(), solutionAndExample.strip()

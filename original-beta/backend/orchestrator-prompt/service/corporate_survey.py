import logging
import re

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.corporate_survey import CorporateSurveyPostRequest
from service.web_search import WebSearchService
from system.corporate_survey import get_corporate_survey_message


class CorporateSurveyService:
    def __init__(
        self,
        aoaiRepository: AoaiRepository,
        # webSearchService: WebSearchService,
        request: func.HttpRequest,
    ):
        self.aoaiRepository = aoaiRepository
        # self.webSearchService = webSearchService
        self.request = request

    def body_parser(self) -> CorporateSurveyPostRequest:
        req_body = self.request.get_json()
        survey_company = req_body.get("surveyCompany")
        survey_content = req_body.get("selectedOptions")
        survey_information = req_body.get("additionalConsideration", "")

        params = CorporateSurveyPostRequest(
            surveyCompany=survey_company,
            surveyContent=survey_content,
            surveyInformation=survey_information,
        )
        logging.info(f"Request body: {params}")
        return params

    # 企業調査結果取得
    def process_corporate_survey(self):
        survey_company = self.body_parser().surveyCompany
        survey_content = self.body_parser().surveyContent
        survey_information = self.body_parser().surveyInformation

        # keywords_list = [f"{survey_company} {content}" for content in survey_content]

        # if survey_information:
        #     keywords_list.append(f"{survey_company} {survey_information}")

        # logging.info(f"keywords list: {keywords_list}")

        # # 検索ワードをもとにbing searchを実行
        # concatenated_search_results = (
        #     self.webSearchService.retrieve_search_results_async(keywords_list)
        # )

        # logging.info(f"Concatenated search results: {concatenated_search_results}")

        # snippets = re.findall(r"snippet:\s*(.*)", concatenated_search_results)

        # # 半角スペースで連結しhtmlタグを削除
        # concatenated_snippet = " ".join(snippets)
        # clean_snippet = re.sub(r"<[^>]*>", "", concatenated_snippet)

        # 企業情報取得
        corporate_information = self.aoaiRepository.get_corporate_information(
            get_corporate_survey_message(
                survey_company,
                survey_content,
                survey_information,  # clean_snippet
            )
        )

        logging.info(f"Got corporate information: {corporate_information}")

        return {
            "results": corporate_information,
            "success": True,
        }

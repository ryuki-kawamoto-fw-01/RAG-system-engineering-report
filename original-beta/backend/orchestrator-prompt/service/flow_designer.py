import logging
import re

import azure.functions as func

from modules.file import FileModule
from repository.aoai import AoaiRepository
from schema.flow_designer import FixFlowDesignerPostRequest, FlowDesignerPostRequest
from system.flow_designer import get_fix_user_message, get_user_message


# 新規作成
class FlowDesignerService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self) -> FlowDesignerPostRequest:
        form = self.request.form

        # フォームデータの取得
        text = form.get("text")
        type = form.get("type")
        consideration = form.get("consideration")

        # ファイルアップロード時はfile_parser()でoriginal_textを取得
        if not text and self.request.files and self.request.files.getlist("fileList"):
            text = self.file_parser()  # ファイル内容をtextとして渡す

        params = FlowDesignerPostRequest(
            text=text,
            type=type,
            consideration=consideration,
        )
        logging.info(f"Request form: {params}")
        return params

    def file_parser(self) -> str:
        original_text = ""
        files = self.request.files
        text = self.request.form.get("text")

        # ファイルアップロードがある場合
        if files and files.getlist("fileList"):
            file_list = files.getlist("fileList")
            logging.info(f"Received file_list: {file_list}")

            for file in file_list:
                name, content_text, extension = FileModule(file).content()
                logging.info(
                    f"File - Name: {name}, Content: {content_text}, Extension: {extension}"
                )
                original_text += f"{content_text}\n"
        else:
            # ファイルがない場合はtext入力を使う
            if text is None:
                logging.error("text is required")
                return func.HttpResponse("textは必須です", status_code=400)
            original_text = text
            logging.info(f"Received text: {original_text}")

        # 制御文字のうち、\n（改行）と\t（タブ）は許可し、それ以外を除去
        original_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", original_text)

        return original_text

    def post_flow_designer(self):
        params = self.form_parser()
        answer = self.repository.create_aoai_answer_reasoning(
            get_user_message(
                params.text,
                params.type,
                params.consideration,
            )
        )
        response_data = {
            "flow_designer_result": answer,
            "success": True,
        }
        return response_data


# 結果調整
class FixFlowDesignerService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> FixFlowDesignerPostRequest:
        req_body = self.request.get_json()
        result = req_body.get("result")
        revisionPrompt = req_body.get("revisionPrompt")

        params = FixFlowDesignerPostRequest(
            result=result,
            revisionPrompt=revisionPrompt,
        )

        logging.info(f"Request body: {params}")
        return params

    def post_fix_flow_designer(self):
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

import json
import logging
import os

import azure.functions as func

from modules.file_prompt import get_file_content
from modules.talkscript import split_pptx
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.talk_script import CreateTalkScriptPostRequest
from system.create_talk_script import get_create_talk_script_message
from modules.errors.custom_errors import LLMSpecificError


class CreateTalkScriptService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        self.blob_storage = BlobStorageService(
            container_name=os.environ["AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME"]
        )

    def form_parser(self) -> CreateTalkScriptPostRequest:
        # JSONボディからデータを取得
        try:
            body = self.request.get_json()
        except ValueError:
            logging.error("Invalid JSON body")
            raise ValueError("無効なJSONデータです")

        # データの取得
        file_list = body.get("fileList", [])
        purpose = body.get("purpose")
        partnerCharacteristics = body.get("partnerCharacteristics")
        considerations = body.get("considerations")

        params = CreateTalkScriptPostRequest(
            fileList=file_list,
            purpose=purpose,
            partnerCharacteristics=partnerCharacteristics,
            considerations=considerations,
        )
        logging.info(f"Request body: {params}")
        return params

    def file_parser(self) -> list:
        proposal_files = []

        # JSONボディからファイルリストを取得
        try:
            body = self.request.get_json()
            file_list = body.get("fileList", [])
        except ValueError:
            logging.error("Invalid JSON body")
            raise ValueError("無効なJSONデータです")

        if not file_list:
            logging.error("fileList is required")
            raise ValueError("提案書ファイルは必須です")

        for file_ref in file_list:
            file_path = file_ref.get("name")

            if not file_path:
                logging.error("File path is missing")
                continue

            logging.info(f"Processing file: {file_path}")

            try:
                # Blob Storageからファイルをダウンロード
                content = self.blob_storage.download_file(file_path)

                # ファイル名と拡張子を取得
                name = file_path.split("/")[-1]
                extension = name.split(".")[-1].lower()

                logging.info(f"File - Name: {name}, Extension: {extension}")

                if extension == "pptx":
                    # 提案書ファイルを1ページごとに分割
                    try:
                        slides_content = split_pptx(content)
                    except Exception as e:
                        logging.error(f"Error splitting PPTX: {e}")
                        raise LLMSpecificError(
                            "E_B3_00130",
                            value="メッセージ"
                        )

                    for slide_content in slides_content:
                        # スライドの内容をテキストとして抽出
                        slide_text = get_file_content(slide_content, extension)
                        proposal_files.append(slide_text)
                        logging.info("スライド1ページずつテキスト抽出")
                else:
                    logging.error(f"Unsupported file extension: {extension}")
                    raise ValueError(
                        f"サポートされていないファイル形式です: {extension}"
                    )

            except Exception as e:
                logging.error(f"Error processing file {file_path}: {e}")
                # LLMSpecificErrorはそのまま再送出して上位でハンドリング
                raise

        return proposal_files

    def post_create_talk_script(self):
        proposal_files = self.file_parser()
        proposal_purpose = self.form_parser().purpose
        proposal_consideration = self.form_parser().considerations
        partner = self.form_parser().partnerCharacteristics
        # 専門性
        partner_expertise = partner.split(",")[0]
        # 興味
        partner_interests = partner.split(",")[1]
        # 親密度
        partner_intimacy = partner.split(",")[2]

        messages = get_create_talk_script_message(
            partner_expertise, partner_interests, partner_intimacy
        )

        # ユーザプロンプトを作成
        user_content = "# 提案書\n"

        # テキストをスライドごとに追加
        for i, slide_text in enumerate(proposal_files):
            user_content += f"## ページ {i}\n{slide_text}\n"

        user_content += f"# 提案書の目的\n{proposal_purpose}"
        if proposal_consideration:
            user_content += f"# 考慮事項\n{proposal_consideration}"

        messages.append({"role": "user", "content": user_content})

        answer = self.repository.create_aoai_answer(messages)
        # レスポンスデータの作成
        response_data = {"answer": answer, "temp_file": user_content, "success": True}

        return response_data

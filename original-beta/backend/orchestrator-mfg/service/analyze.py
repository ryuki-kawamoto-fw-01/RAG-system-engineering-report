import base64
import logging
import tempfile
from typing import List, Tuple

import azure.functions as func

from repository.ai_project import AIProjectRepository
from schema.analyze import AnalyzePostRequest, Message


class AnalyzeService:
    def __init__(self, repository: AIProjectRepository, request: func.HttpRequest):
        self.repo = repository
        self.req = request

    def form_parser(self) -> AnalyzePostRequest:
        """
        処理概要: リクエストボディをパースし、バリデーションを行う
        """

        req_body = self.req.get_json()
        request_data = AnalyzePostRequest(**req_body)
        logging.info(f"Request form: {request_data}")
        return request_data

    def post_analyze(self) -> dict:
        """
        処理概要: AIプロジェクトを活用し、自動でデータ分析を行う
        """
        # パース&バリデーション
        req_body = self.form_parser()

        # ボディの解析
        req_messages = req_body.messages

        # 一時ファイルの保存先として、一時ディレクトリを取得
        temp_file_path = tempfile.gettempdir()
        print("tempfile created")

        # Agent作成
        agent_id = self.repo.create_agent()
        logging.info(f"Created agent, agent ID: {agent_id}")

        # Thread作成
        thread_id = self.repo.create_thread()
        logging.info(f"Created thread, thread ID: {thread_id}")

        # Threadにメッセージを登録
        file_id_list, msg_id_list = self._register_message_to_thread(
            thread_id=thread_id,
            req_messages=req_messages,
            temp_file_path=temp_file_path,
        )

        # Agent実行
        run = self.repo.run_agent(agent_id=agent_id, thread_id=thread_id)

        # Agentの実行失敗時
        if run.status == "failed":
            logging.info(f"Run failed: {run.last_error}")
            # エラーコードとエラーメッセージを取得
            response = run.last_error

        # Agentの実行成功時
        elif run.status == "completed":
            logging.info("Run completed.")
            # 生成結果のメッセージを取得 イテレータのためリストに変換する
            res_messages = list(self.repo.get_thread(thread_id=thread_id))
            mes_list = []
            for message in res_messages:
                id = message.get("id")
                # リクエストに含まれるメッセージの削除
                if id not in msg_id_list and id is not None:
                    mes_list.append(message)

            # 画像出力を確認して、file_nameとfile_contentの付与
            image_files = []
            for message in res_messages:
                contents = message.get("content", [])
                for content in contents:
                    if content.get("type") == "image_file":
                        image_file = content.get("image_file")
                        if image_file:
                            file_id = image_file.get("file_id")
                            file_name = f"{file_id}_image_file.png"
                            if file_id:
                                # 画像ファイルの情報を取得
                                self.repo.save_file(
                                    file_id=file_id,
                                    file_name=file_name,
                                    target_dir=temp_file_path,
                                )
                                logging.info(
                                    f"Saved image file to: {temp_file_path}/{file_name}"
                                )

                                with open(
                                    f"{temp_file_path}/{file_name}", "rb"
                                ) as image_file:
                                    encoded_string = base64.b64encode(
                                        image_file.read()
                                    ).decode("utf-8")
                                    image_files.append(
                                        {
                                            "file_id": file_id,
                                            "file_name": file_name,
                                            "file_content": encoded_string,
                                        }
                                    )

            # レスポンスを整える
            response = self._format_response(messages=mes_list, image_files=image_files)

        # アップロードしたファイルの除去
        for file_id in file_id_list:
            self.repo.delete_file(file_id=file_id)
            logging.info(f"Deleted file, File ID: {file_id}")

        # エージェントの削除
        self.repo.delete_agent(agent_id=agent_id)
        logging.info(f"Deleted agent, Agent ID: {agent_id}")

        # レスポンス返却
        return response

    def _register_message_to_thread(
        self, thread_id: str, req_messages: List[Message], temp_file_path: str
    ) -> Tuple[list, list]:
        """
        処理概要: リクエストボディに含まれるmessageをthreadに登録する
        """
        file_id_list, msg_id_list = [], []

        for req_message in req_messages:
            role = req_message.role
            message_content = req_message.content
            file_name = req_message.file_name
            file_content = req_message.file_content

            # ファイルを含むメッセージの処理
            if file_name is not None and file_content is not None:
                # base64デコード
                file_data = base64.b64decode(file_content)
                # 一時フォルダに保存
                with open(f"{temp_file_path}/{file_name}", "wb") as file:
                    file.write(file_data)
                logging.info("file saved to temporary directory")

                # ファイルアップロード
                file_id = self.repo.upload_file(
                    file_path=f"{temp_file_path}/{file_name}"
                )
                file_id_list.append(file_id)
                logging.info(
                    f"Uploaded file, File ID: {file_id}, File name: {file_name}"
                )

                # メッセージ追加(ファイル付き)
                add_message_id = self.repo.create_message(
                    thread_id=thread_id,
                    role=role,
                    content=message_content,
                    file_id=file_id,
                )
                msg_id_list.append(add_message_id)
                logging.info(
                    f"Created message, Message ID: {add_message_id}, Message content: {message_content}"
                )

            else:
                # メッセージ追加(ファイルなし)
                add_message_id = self.repo.create_message(
                    thread_id=thread_id, role=role, content=message_content
                )
                msg_id_list.append(add_message_id)
                logging.info(
                    f"Created message, Message ID: {add_message_id}, Message content: {message_content}"
                )

        return file_id_list, msg_id_list

    def _format_response(self, messages: list, image_files: list) -> dict:
        """
        AI Projectの返り値を整形し、想定レスポンスボディの形式で返す
        """
        res = []
        for msg in reversed(messages):
            elements = {}
            for content in msg["content"]:
                # メッセージの種類によって処理を分岐させる
                if content["type"] == "image_file":
                    # file_idが存在しているか確認
                    try:
                        file_id = content["image_file"]["file_id"]
                    except:
                        file_id = None
                    # 存在している場合の処理
                    if file_id is not None:
                        # 画像リストから一致するfile_idを検索
                        image_file = next(
                            (
                                item
                                for item in image_files
                                if item["file_id"] == file_id
                            ),
                            None,
                        )
                        if image_file:
                            elements["file_name"] = image_file["file_name"]
                            elements["file_content"] = image_file["file_content"]
                elif content["type"] == "text":
                    elements["role"] = msg["role"]
                    elements["content"] = content["text"]["value"]
                else:
                    # Unknown contents
                    pass
            res.append(elements)
        return {"messages": res}

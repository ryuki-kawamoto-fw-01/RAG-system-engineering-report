import html
import json
import logging
import os
import re

import azure.functions as func

from modules.file_prompt import get_file_content
from repository.aoai import AoaiRepository
from repository.blob_storage import BlobStorageService
from schema.product_idea import ProductIdeaPostRequest, FileReference
from system.create_product_idea import get_create_product_idea_system_message


class CreateProductIdeaService:

    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
        # Blob Storage サービスの初期化
        container_name = os.environ.get("AZURE_STORAGE_TEMP_FILE_CONTAINER_NAME")
        if container_name:
            self.blob_storage = BlobStorageService(container_name=container_name)
        else:
            self.blob_storage = None

    def form_parser(self) -> ProductIdeaPostRequest:
        logging.info("=== form_parser START ===")
        form = self.request.form

        if form is None:
            logging.error("Form data is required")
            raise ValueError("入力が不正です")

        # フォームデータの取得
        # 新商品アイデア作成の指示(テキストorファイルアップロード)
        product_idea_instruction = form.get("text")
        logging.info(f"Raw text: {product_idea_instruction}")
        # 方向性
        product_idea_direction = form.get("ideaDirection")
        logging.info(f"Raw ideaDirection: {product_idea_direction}")
        # 考慮点
        product_idea_consideration = form.get("additionalConsiderations")
        logging.info(f"Raw additionalConsiderations: {product_idea_consideration}")
        # ユーザーのチャットの入力
        user_chat = form.get("chat")
        logging.info(f"Raw chat: {user_chat}")
        # チャットの履歴
        chat_history_str = form.get("chatHistory")
        logging.info(f"Raw chatHistory: {chat_history_str}")

        # JSON文字列化されている可能性があるフィールドをパース
        def parse_if_json(value, field_name="unknown"):
            if value and isinstance(value, str):
                try:
                    # JSON文字列化されている場合はパース
                    if (
                        value.startswith('"')
                        or value.startswith("[")
                        or value.startswith("{")
                    ):
                        parsed = json.loads(value)
                        logging.info(f"Parsed {field_name}: {parsed}")
                        return parsed
                except (json.JSONDecodeError, Exception) as e:
                    logging.error(f"Failed to parse {field_name}: {e}")
                    pass
            return value

        product_idea_instruction = parse_if_json(product_idea_instruction, "text")
        product_idea_direction = parse_if_json(product_idea_direction, "ideaDirection")
        product_idea_consideration = parse_if_json(
            product_idea_consideration, "additionalConsiderations"
        )
        user_chat = parse_if_json(user_chat, "chat")

        logging.info(f"Parsed Direction: {product_idea_direction}")

        chat_history = []
        if chat_history_str:
            try:
                chat_history_dict = (
                    json.loads(chat_history_str)
                    if isinstance(chat_history_str, str)
                    else chat_history_str
                )
                logging.info(f"Parsed chatHistory: {chat_history_dict}")
            except (json.JSONDecodeError, Exception) as e:
                logging.error(f"Failed to parse chatHistory: {e}")
                raise ValueError(f"chatHistoryのパースに失敗しました: {e}")

            if chat_history_dict:
                # chat_historyの最後の要素とchatの内容が同じ場合、重複しないようにchatHistoryの末尾の要素は削除してシステムメッセージに渡す
                value = chat_history_dict[-1].get("chat")
                if user_chat == value:
                    chat_history_dict.pop()
                # もしリストの要素が6つより多い（履歴が3往復より多い）場合は6つになるまで古いものを消していく
                while len(chat_history_dict) > 6:
                    chat_history_dict.pop(0)
                # システムメッセージに渡すために形式を変換
                chat_history = [
                    {item["role"]: item["chat"]} for item in chat_history_dict
                ]

        if not product_idea_direction:
            logging.error("ideaDirection is empty or None")
            raise ValueError("方向性は必須です")

        try:
            params = ProductIdeaPostRequest(
                text=product_idea_instruction,
                ideaDirection=product_idea_direction,
                additionalConsiderations=product_idea_consideration,
                userChat=user_chat,
                chatHistory=chat_history,
            )
            logging.info(f"Created params: {params}")
            logging.info("=== form_parser END ===")
            return params
        except Exception as e:
            logging.error(
                f"Failed to create ProductIdeaPostRequest: {e}", exc_info=True
            )
            raise ValueError(f"パラメータの作成に失敗しました: {e}")

    def file_parser(self) -> str:
        """
        ファイル参照のリストを受け取り、Blob Storageからファイルを読み込んで処理
        """
        logging.info("=== file_parser START ===")
        original_text = ""
        form = self.request.form

        # FormData の全キーをログに出力（デバッグ用）
        if form:
            logging.info(f"Form keys: {list(form.keys())}")
            for key in form.keys():
                logging.info(f"Form[{key}] = {form.get(key)}")
        else:
            logging.warning("Form is None")

        # fileList と text が FormData に含まれているかチェック
        file_list_json = form.get("fileList") if form else None
        text = form.get("text") if form else None
        logging.info(f"fileList raw value: {file_list_json}")
        logging.info(f"text raw value: {text}")

        # 入力形式がfileの場合
        if file_list_json and file_list_json.strip():
            logging.info("Processing file upload mode")
            # JSON パースと Pydantic バリデーション
            try:
                file_list_raw = (
                    json.loads(file_list_json)
                    if isinstance(file_list_json, str)
                    else file_list_json
                )
                file_list = [FileReference(**file_ref) for file_ref in file_list_raw]
            except (json.JSONDecodeError, Exception) as e:
                logging.error(f"Failed to parse fileList: {e}")
                raise ValueError(f"fileListの形式が不正です: {e}")

            logging.info(f"Received file_list: {file_list}, count: {len(file_list)}")

            # ファイルリストが空の場合
            if not file_list or len(file_list) == 0:
                logging.error("fileList is empty")
                raise ValueError(
                    "ファイルが選択されていません。ファイルをアップロードするか、テキスト入力を使用してください。"
                )

            if not self.blob_storage:
                logging.error("Blob Storage service is not initialized")
                raise ValueError("Blob Storage設定が不正です")

            for file_ref in file_list:
                file_path = file_ref.name

                try:
                    logging.info(f"Downloading file: {file_path}")
                    file_stream = self.blob_storage.download_file(file_path)

                    extension = file_path.split(".")[-1].lower()
                    file_name = file_path.split("/")[-1]

                    try:
                        content_text = get_file_content(file_stream, extension)
                    except Exception as e:
                        # LLMSpecificErrorはそのまま再送出
                        logging.error(f"Failed to get file content: {e}")
                        raise

                    original_text += f"{content_text}\n"
                    logging.info(
                        f"Processed file: {file_name}, content: {content_text}"
                    )

                except Exception as e:
                    logging.error(
                        f"Failed to process file {file_path}: {e}", exc_info=True
                    )
                    # LLMSpecificErrorはそのまま再送出して上位でハンドリング
                    raise

        # テキスト入力モードの場合
        elif text and text.strip():
            logging.info("Processing text input mode")
            # textフィールドから取得
            logging.info(f"Raw text from form: {text}")
            # textがJSON文字列化されている可能性があるので処理
            try:
                # JSON文字列化されている場合はパース
                if isinstance(text, str) and text.startswith('"'):
                    text = json.loads(text)
                    logging.info(f"Parsed text: {text}")
            except (json.JSONDecodeError, Exception) as e:
                logging.warning(f"Failed to parse text as JSON, using as-is: {e}")
                # パースに失敗した場合はそのまま使用
                pass

            original_text = text
            logging.info(f"Final text: {original_text}")

        # ファイルもテキストもない場合
        else:
            logging.error("Neither fileList nor text is provided")
            raise ValueError("ファイルをアップロードするか、テキストを入力してください")

        # 制御文字のうち、\n（改行）と\t（タブ）は許可し、それ以外を除去
        original_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]+", "", original_text)
        logging.info(f"Final original_text length: {len(original_text)}")
        logging.info("=== file_parser END ===")

        return original_text

    def post_create_product_idea(self) -> dict:
        logging.info("=== post_create_product_idea START ===")
        # フォームデータを一度だけパース
        try:
            form_params = self.form_parser()
        except Exception as e:
            logging.error(f"form_parser failed: {e}", exc_info=True)
            raise

        # テキスト入力またはファイルの取得
        try:
            product_idea_instruction = self.file_parser()
        except Exception as e:
            logging.error(f"file_parser failed: {e}", exc_info=True)
            raise

        # 方向性
        product_idea_direction = form_params.ideaDirection
        # 考慮点
        product_idea_consideration = form_params.additionalConsiderations
        # ユーザーの入力
        user_chat = form_params.userChat
        # チャット履歴
        chat_history = form_params.chatHistory

        logging.info(
            f"Final params - "
            f"instruction length: {len(product_idea_instruction)}, "
            f"direction: {product_idea_direction}, "
            f"consideration: {product_idea_consideration}, "
            f"user_chat: {user_chat}, "
            f"chat_history length: {len(chat_history) if chat_history else 0}"
        )

        # システムメッセージの作成
        logging.info("Creating system message...")
        try:
            message = get_create_product_idea_system_message(
                new_product_idea_instruction=product_idea_instruction,
                new_product_idea_direction=product_idea_direction,
                new_product_idea_consideration=product_idea_consideration or "",
                user_chat=user_chat or "",
                chat_history=chat_history or [],
            )
            logging.info("System message created successfully")
        except Exception as e:
            logging.error(f"Failed to create system message: {e}", exc_info=True)
            raise

        # AOAIにメッセージを投げて結果を取得する
        logging.info("Calling AOAI...")
        try:
            answer, idea = self.repository.parse_aoai_answer_product_idea(message)
            logging.info(
                f"AOAI response received - answer length: {len(answer)}, idea length: {len(idea) if idea else 0}"
            )
        except Exception as e:
            logging.error(f"AOAI call failed: {e}", exc_info=True)
            raise

        # \nの改行を<br/>に変換
        answer = html.escape(answer)
        answer = answer.replace("\n", "<br/>")

        logging.info("Creating response data...")
        response_data = {
            "content": idea,
            "chat": answer,
            "success": True,
        }
        logging.info("=== post_create_product_idea END ===")

        return response_data

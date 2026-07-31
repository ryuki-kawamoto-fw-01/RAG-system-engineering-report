from typing import Any, Dict

from azure.functions import HttpRequest
from pydantic import ValidationError

from repository.aoai import AoaiRepository
from schema.faq import FaqRequestSchema
from system.faq_creation import get_faq_message


class FaqService:
    def __init__(self, repository: AoaiRepository, request: HttpRequest):
        self.repository = repository
        self.request = request

    def post_faq(self) -> Dict[str, Any]:
        try:
            # FormDataかJSONかを判断して適切に処理
            content_type = self.request.headers.get("content-type", "")

            if "application/json" in content_type:
                # JSONの場合の処理
                try:
                    body = self.request.get_json()
                except ValueError:
                    raise ValidationError("リクエストボディが不正です")

                # バリデーション
                data = FaqRequestSchema(**body)

            elif (
                "multipart/form-data" in content_type
                or "application/x-www-form-urlencoded" in content_type
            ):
                # FormDataの場合の処理
                text = self.request.form.get("text")
                document_type = self.request.form.get("documentType", "FAQ")

                # checkpointsはカンマ区切りの文字列として送信される
                checkpoints_str = self.request.form.get("checkpoints", "")
                checkpoints = checkpoints_str.split(",") if checkpoints_str else []

                additional_considerations = self.request.form.get(
                    "additionalConsiderations"
                )

                # データを構築
                form_data = {
                    "text": text,
                    "documentType": document_type,
                    "checkpoints": checkpoints,
                    "additionalConsiderations": additional_considerations,
                }

                # バリデーション
                data = FaqRequestSchema(**form_data)
            else:
                raise ValidationError("サポートされていないContent-Typeです")

            # メッセージの組み立て
            messages = get_faq_message(
                document_type=data.documentType,
                checkpoints=data.checkpoints,
                additional_considerations=data.additionalConsiderations,
                text=data.text,
            )

            # OpenAIなどのAPI呼び出し
            response = self.repository.create_aoai_answer(messages)

            return {"content": response, "success": True}

        except ValidationError as e:
            return {"message": str(e), "success": False}
        except Exception as e:
            return {"message": f"エラーが発生しました: {str(e)}", "success": False}

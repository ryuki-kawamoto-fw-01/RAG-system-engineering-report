import json
import logging
import os
from typing import Dict, List

import requests
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from openai import AzureOpenAI
from pydantic import BaseModel, Field

# logging
from modules.contextLog.logger import log


# responseフォーマットの指定
class TextCorrectionResponse(BaseModel):
    points_of_criticism: str = Field(..., description="指摘事項")
    corrected_text: str = Field(..., description="校正後文章")


class TextCheckResponse(BaseModel):
    evaluation: str = Field(..., description="評価事項")
    corrected_text: str = Field(..., description="修正後文章")


class CreateMailResponse(BaseModel):
    subject: str = Field(..., description="メールの件名")
    content: str = Field(..., description="本文")


class CreateSourceCodeResponse(BaseModel):
    chat: str = Field(..., title="チャット形式の回答")
    source_code: str = Field(..., title="生成されたソースコード")


class CreateProductIdeaResponse(BaseModel):
    chat: str = Field(..., description="チャット形式の回答")
    content: str = Field(description="レポート形式の回答")


class TermSummaryResponse(BaseModel):
    term_summary_result: str = Field(..., description="要約結果")
    term_explanation: str = Field(..., description="用語解説")


class TechassessReportResponse(BaseModel):
    content: str = Field(..., description="技術評価レポート全文")


# Azure OpenAIのクライアントを初期化
credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

aoai_client = AzureOpenAI(
    azure_endpoint=os.environ["LOAD_BALANCER_ENDPOINT"],
    # azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    azure_ad_token_provider=token_provider,
    api_version=os.environ["AZURE_OPENAI_VERSION"],
)


class AoaiRepository:
    def create_aoai_answer(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"
        try:
            completion = aoai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=float(os.environ["TEMPERATURE"]),
            )
            # 回答の取得
            answer = completion.choices[0].message.content
            log(
                {
                    "model": model,
                    "inputToken": completion.usage.prompt_tokens,
                    "outputToken": completion.usage.completion_tokens,
                }
            )
            return answer
        except Exception as e:
            logging.error(f"OpenAI API error in create_aoai_answer: {e}", exc_info=True)
            raise

    def create_aoai_answer_reasoning(self, messages: List[Dict[str, str]]) -> str:
        logging.info(f"Messages: {messages}")
        model = f"gpt-5.2-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.chat.completions.create(
            model=model, messages=messages, reasoning_effort="none"
        )

        # 回答の取得
        answer = completion.choices[0].message.content
        logging.info(f"Answer: {answer}")

        # logging
        log(
            {
                "model": model,
                "inputToken": completion.usage.prompt_tokens,
                "outputToken": completion.usage.completion_tokens,
            }
        )

        return answer

    # 新商品のアイデア作成用
    def parse_aoai_answer_product_idea(self, messages: List[Dict[str, str]]) -> str:
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
            response_format=CreateProductIdeaResponse,
        )

        # 回答の取得
        chat = completion.choices[0].message.parsed.chat
        idea = completion.choices[0].message.parsed.content

        return chat, idea

    # 文書校正用
    def parse_aoai_answer_text_correction(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
            response_format=TextCorrectionResponse,
        )

        # 回答の取得
        corrected_text = completion.choices[0].message.parsed.corrected_text
        points_of_criticism = completion.choices[0].message.parsed.points_of_criticism

        # logging
        log(
            {
                "model": model,
                "inputToken": completion.usage.prompt_tokens,
                "outputToken": completion.usage.completion_tokens,
            }
        )

        return corrected_text, points_of_criticism

    # 文章内容チェック用
    def parse_aoai_answer_text_check(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
            response_format=TextCheckResponse,
        )

        # ここで生レスポンスを確認
        import logging

        logging.info(f"OpenAI message content: {completion.choices[0].message.content}")
        logging.info(
            f"OpenAI parsed: {getattr(completion.choices[0].message, 'parsed', None)}"
        )

        evaluation = completion.choices[0].message.parsed.evaluation
        corrected_text = completion.choices[0].message.parsed.corrected_text

        log(
            {
                "model": model,
                "inputToken": completion.usage.prompt_tokens,
                "outputToken": completion.usage.completion_tokens,
            }
        )

        return evaluation, corrected_text

    # メール作成用
    def parse_aoai_answer_create_mail(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
            response_format=CreateMailResponse,
        )

        # 回答の取得
        subject = completion.choices[0].message.parsed.subject
        content = completion.choices[0].message.parsed.content

        # logging
        log(
            {
                "model": model,
                "inputToken": completion.usage.prompt_tokens,
                "outputToken": completion.usage.completion_tokens,
            }
        )

        return subject, content

    # ソースコード生成用
    def parse_aoai_answer_source_code(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"
        completion = aoai_client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
            response_format=CreateSourceCodeResponse,
        )
        chat = completion.choices[0].message.parsed.chat
        source_code = completion.choices[0].message.parsed.source_code
        return chat, source_code

    # 企業調査用
    def get_corporate_information(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
        )

        # 回答の取得
        result = completion.choices[0].message.content
        logging.info(f"get_corporate_information result: {result}")

        # logging
        log(
            {
                "model": model,
                "inputToken": completion.usage.prompt_tokens,
                "outputToken": completion.usage.completion_tokens,
            }
        )

        return result

    # 製品比較用
    def parse_aoai_answer_product_comparison(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
        )

        # 回答の取得（AIから返されたテキストをJSONとしてパース）
        answer = completion.choices[0].message.content
        try:
            table_json = json.loads(answer)
        except Exception as e:
            logging.error(f"JSON parse error: {e}, answer: {answer}")
            # パースできない場合はそのまま返す
            return {"error": "AI出力がJSON形式ではありません", "raw": answer}

        logging.info(f"parse_aoai_answer_product_comparison result: {table_json}")

        return table_json

    # ブレインストーミング
    def parse_aoai_answer_brainstorming(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"
        try:
            completion = aoai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=float(os.environ["TEMPERATURE"]),
            )

            # 回答の取得（AIから返されたテキストをJSONとしてパース）
            answer = completion.choices[0].message.content
            return answer
        except Exception as e:
            logging.error(
                f"OpenAI API error in create_aoai_answer_o1: {e}", exc_info=True
            )

        # マーケティング戦略の作成

    def parse_aoai_answer_marketing_strategy(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"
        try:
            completion = aoai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=float(os.environ["TEMPERATURE"]),
            )

            # 回答の取得（AIから返されたテキストをJSONとしてパース）
            answer = completion.choices[0].message.content
            return answer
        except Exception as e:
            logging.error(
                f"OpenAI API error in create_aoai_answer_o1: {e}", exc_info=True
            )
            raise

    # 専門用語の解説と要約用
    def parse_aoai_answer_term_summary(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"
        try:
            completion = aoai_client.beta.chat.completions.parse(
                model=model,
                messages=messages,
                temperature=float(os.environ["TEMPERATURE"]),
                response_format=TermSummaryResponse,
            )
            # 回答の取得
            term_summary_result = completion.choices[
                0
            ].message.parsed.term_summary_result
            term_explanation = completion.choices[
                0
            ].message.parsed.term_explanation  # noqa:E501
            return term_summary_result, term_explanation
        except Exception as e:
            logging.error(
                f"OpenAI API error in parse_aoai_answer_term_summary: {e}",
                exc_info=True,
            )
            raise

    # 技術報告レポート用
    def get_techassess_report(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"

        completion = aoai_client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            temperature=float(os.environ["TEMPERATURE"]),
            response_format=TechassessReportResponse,
        )

        parsed = completion.choices[0].message.parsed

        result = {
            "content": parsed.content,
        }

        logging.info(f"get_techassess_report result: {result}")

        log(
            {
                "model": model,
                "inputToken": completion.usage.prompt_tokens,
                "outputToken": completion.usage.completion_tokens,
            }
        )

        return result

    # 設計書の作成
    def parse_aoai_answer_design_document(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"
        try:
            completion = aoai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=float(os.environ["TEMPERATURE"]),
            )

            # 回答の取得（AIから返されたテキストをJSONとしてパース）
            answer = completion.choices[0].message.content
            return answer
        except Exception as e:
            logging.error(
                f"OpenAI API error in create_aoai_answer_o1: {e}", exc_info=True
            )
            raise

    # 議事録テンプレート用
    def get_minutes_template(self, messages: List[Dict[str, str]]):
        model = f"gpt-4.1-{os.environ['MODEL_IDENTIFIER']}"
        try:
            completion = aoai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=float(os.environ["TEMPERATURE"]),
                response_format={"type": "json_object"},
            )

            # 回答の取得（AIから返されたテキストをJSONとしてパース）
            answer = completion.choices[0].message.content
            logging.info(f"get_minutes_template raw answer: {answer}")

            try:
                json_result = json.loads(answer)
                logging.info(f"get_minutes_template parsed result: {json_result}")
                return json_result
            except json.JSONDecodeError as e:
                logging.error(f"JSON parse error: {e}, answer: {answer}")
                raise ValueError(f"AI出力がJSON形式ではありません: {answer}")

        except Exception as e:
            logging.error(
                f"OpenAI API error in get_minutes_template: {e}", exc_info=True
            )
            raise

    def create_aoai_image(
        prompt: str, size: str = "1024x1024", output_format: str = "jpeg"
    ):
        try:
            logging.info(f"Image generation prompt: {prompt}")

            endpoint = os.environ["AZURE_OPEN_AI_IMAGE_ENDPOINT"]
            api_version = os.environ["AZURE_OPENAI_IMAGE_VERSION"]
            deployment_name = f"gpt-image-1.5-{os.environ['MODEL_IDENTIFIER']}"

            # マネージドID認証用のトークン取得
            token = credential.get_token("https://cognitiveservices.azure.com/.default")
            access_token = token.token

            url = f"{endpoint}/openai/deployments/{deployment_name}/images/generations?api-version={api_version}"

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }

            # output_formatを正規化（jpgをjpegに変換）
            normalized_format = (
                "jpeg" if output_format.lower() in ["jpg", "jpeg"] else output_format
            )

            payload = {
                "prompt": prompt,
                "model": "gpt-image-1.5",  # API仕様に合わせたモデル名
                "size": size,
                "quality": "medium",
                "output_format": normalized_format,
                "n": 1,
            }

            logging.info(f"POST {url} payload: {payload}")

            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()

            result = response.json()
            logging.info(f"Image generation response: {result}")

            if "data" in result and len(result["data"]) > 0:
                image_data = result["data"][0]
                # "url" か "b64_json" を取得
                image_content = image_data.get("url") or image_data.get("b64_json")
                if image_content:
                    return image_content
                else:
                    logging.error(
                        f"No image URL or b64_json found in response: {image_data}"
                    )
                    raise ValueError("No image URL or b64_json found in response")

        except Exception as e:
            logging.error(f"Error in image generation: {str(e)}", exc_info=True)
            raise

    def create_aoai_fix_image(
        prompt: str, image: str, output_format: str = "png", size: str = "1024x1024"
    ):
        try:
            import base64

            image_bytes = base64.b64decode(image)

            endpoint = os.environ["AZURE_OPEN_AI_IMAGE_ENDPOINT"]
            api_version = os.environ["AZURE_OPENAI_IMAGE_VERSION"]
            deployment_name = f"gpt-image-1.5-{os.environ['MODEL_IDENTIFIER']}"

            # マネージドID認証用のトークン取得
            token = credential.get_token("https://cognitiveservices.azure.com/.default")
            access_token = token.token

            url = f"{endpoint}/openai/deployments/{deployment_name}/images/edits?api-version={api_version}"

            headers = {
                "Authorization": f"Bearer {access_token}",
            }

            # output_formatを正規化（jpgをjpegに変換）
            normalized_format = (
                "jpeg" if output_format.lower() in ["jpg", "jpeg"] else output_format
            )

            payload = {
                "prompt": prompt,
                "model": "gpt-image-1.5",  # API仕様に合わせたモデル名
                "size": size,
                "quality": "medium",
                "output_format": normalized_format,
                "n": 1,
            }

            files = {
                "image": ("image.png", image_bytes, "image/png"),
            }

            logging.info(f"POST {url} payload: {payload}")

            response = requests.post(url, headers=headers, data=payload, files=files)
            logging.info(f"API raw response: {response.text}")
            response.raise_for_status()

            result = response.json()
            logging.info(f"Image generation response: {result}")

            if "data" in result and len(result["data"]) > 0:
                image_data = result["data"][0]
                # "url" か "b64_json" を取得
                image_content = image_data.get("url") or image_data.get("b64_json")
                if image_content:
                    return image_content
                else:
                    logging.error(
                        f"No image URL or b64_json found in response: {image_data}"
                    )
                    raise ValueError("No image URL or b64_json found in response")

        except Exception as e:
            if hasattr(e, "response") and e.response is not None:
                logging.error(f"API error response: {e.response.text}")
            logging.error(f"Error in image generation: {str(e)}", exc_info=True)
            raise

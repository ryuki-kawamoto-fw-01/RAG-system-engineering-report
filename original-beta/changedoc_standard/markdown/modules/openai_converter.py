import base64
import io
import logging
import os
from typing import List, Optional, Union

import fitz  # PyMuPDF
import openai
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from PIL import Image

# 環境変数名の定数定義
AZURE_OPENAI_ENDPOINT_ENV = "AZURE_AI_FOUNDRY_ENDPOINT"
AZURE_OPENAI_MODEL_NAME_ENV = "AZURE_AI_FOUNDRY_MODEL_NAME"
AZURE_OPENAI_API_VERSION_ENV = "AZURE_AI_FOUNDRY_API_VERSION"


class OpenAIDocumentConverter:
    """
    Azure OpenAI GPT-4 Miniを使用して画像やPDFをマークダウンに変換するコンバーター
    """

    def __init__(self):
        self.api_endpoint = os.environ[AZURE_OPENAI_ENDPOINT_ENV]
        self.api_version = os.environ.get(
            AZURE_OPENAI_API_VERSION_ENV, "2025-01-01-preview"
        )
        self.gpt_model_name = os.environ[AZURE_OPENAI_MODEL_NAME_ENV]

    def send_request_to_azure_openai(self, messages):
        """
        Azure OpenAI APIにリクエストを送信する
        """
        try:

            credential = DefaultAzureCredential()
            token_provider = get_bearer_token_provider(
                credential, "https://cognitiveservices.azure.com/.default"
            )
            client = openai.AzureOpenAI(
                azure_endpoint=self.api_endpoint,
                azure_ad_token_provider=token_provider,
                api_version=self.api_version,
            )

            completion = client.chat.completions.create(
                model=self.gpt_model_name,
                messages=messages,
                stop=None,
                stream=False,
            )
            return completion

        except Exception as e:
            logging.error(
                f"Azure OpenAI APIリクエスト中にエラーが発生しました: {str(e)}"
            )
            raise

    def pdf_to_pil_images(self, pdf_stream: bytes) -> List[Image.Image]:
        """
        PDFファイルストリームをPIL Imageオブジェクトのリストに変換
        """
        pil_images: List[Image.Image] = []

        try:
            # ストリームからPDFを開く
            pdf_document = fitz.open(stream=pdf_stream, filetype="pdf")

            for page_number, page in enumerate(pdf_document):
                # ページをピクスマップにレンダリング
                pix = page.get_pixmap(alpha=False)

                # PyMuPDFピクスマップをバイトに変換
                img_bytes = pix.tobytes("png")

                # バイトからPIL Imageを作成
                img = Image.open(io.BytesIO(img_bytes))

                # 結果リストに追加
                pil_images.append(img)

                # ピクスマップをクリーンアップ
                pix = None

            # PDFドキュメントを閉じる
            pdf_document.close()

            return pil_images
        except Exception as e:
            logging.error(f"PDF画像変換中にエラーが発生しました: {str(e)}")
            raise

    def image_to_markdown(self, img: Image.Image) -> str:
        """
        PIL Imageオブジェクトをマークダウン形式に変換
        """
        try:
            # APIエンドポイントの確認
            if not self.api_endpoint:
                logging.error(
                    f"API設定が不完全です - エンドポイント: {'設定済み' if self.api_endpoint else '未設定'}"
                )
                return "エラー: Azure OpenAI API設定が未完了です。環境変数を確認してください。"

            # 画像のサイズ確認（大きすぎるとエラーになる可能性）
            img_width, img_height = img.size
            logging.info(f"画像サイズ: {img_width}x{img_height}ピクセル")

            # 画像が大きすぎる場合はリサイズ（必要に応じて）
            max_size = 4000  # OpenAIの推奨上限
            if img_width > max_size or img_height > max_size:
                logging.info(
                    f"画像が大きすぎるため、リサイズします: {img_width}x{img_height} -> 最大{max_size}px"
                )
                ratio = min(max_size / img_width, max_size / img_height)
                new_width = int(img_width * ratio)
                new_height = int(img_height * ratio)
                img = img.resize((new_width, new_height), Image.LANCZOS)

            # 画像をbase64形式に変換
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            image_url = f"data:image/png;base64,{img_base64}"
            logging.info(f"Base64エンコード画像のサイズ: {len(img_base64)} 文字")

            # メッセージリスト作成
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "添付画像から画像の情報をマークダウン形式に整理し、テキスト化してください:\n画像に含まれる文字情報、構造、リスト、表などを適切なマークダウンフォーマットで記載します。画像内に図やイラスト、写真が含まれている場合は、図があった位置に「図のキャプション」とそれに関連する説明を加えてください。\n# 手順\n1. 画像の内容を抽出:\n- 画像に含まれるテキスト、表、箇条書き、項目見出しなどを忠実に転写してください。\n- 見出しは #、リストは - や番号付きリストを使用します。\n2. 図の取り扱い:\n- 図やイラスト、写真が含まれている場合、その図があった位置に、以下の形式で記載してください。  写真の場合は図の部分を写真に置き換えて出力してください:\nmarkdown\n**[図X: 図の説明（例: プロセスやグラフの内容）]**\n- 図に関する補足説明を追記します。\n\n3. フォーマットの整合性:\n- 表形式の情報がある場合、Markdownの表記法（|---|---|）を使って表現してください。\n- 画像内にある明らかな構成や階層（大見出し/小見出しなど）を忠実に再現します。\n# Output Format\nすべての情報は以下の形式で出力してください:\n1. マークダウン形式で情報を出力。\n2. 見出し (# ~ ###)、リスト (- / 数値付き)、表（|---|---|）を適切に利用。\n3. 図に関しては「[図X: 図の説明]」と補足を添えて挿入。\n4. 日本語で正確に記述。",
                        },
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ]

            logging.info(
                f"Azure OpenAI API ({self.api_endpoint}, モデル: {self.gpt_model_name}) にリクエスト送信"
            )

            # Azure OpenAIにリクエストを送信し、レスポンスを取得する
            response = self.send_request_to_azure_openai(messages)
            if hasattr(response, "choices") and len(response.choices) > 0:
                md_txt = response.choices[0].message.content
                logging.info(f"Azure OpenAI API からの応答: {len(md_txt)} 文字")
                return md_txt
            else:
                logging.error(f"Azure OpenAI API からの応答が異常: {response}")
                return "エラー: OpenAI APIからの応答形式が不正です"

        except Exception as e:
            logging.error(
                f"画像→マークダウン変換中にエラーが発生しました: {str(e)}",
                exc_info=True,
            )
            return f"エラー: 画像の処理に失敗しました - {str(e)}"

    def pdf_to_markdown(self, file_stream: bytes) -> str:
        """
        PDFファイルをマークダウン形式に変換
        """
        try:
            # PDFをPIL画像のリストに変換
            images = self.pdf_to_pil_images(file_stream)

            # 各画像をマークダウンに変換して結合
            md_txt = ""
            for i, img in enumerate(images):
                logging.info(f"PDFページ {i+1}/{len(images)} の処理中...")
                page_md = self.image_to_markdown(img)
                if i > 0:
                    md_txt += "\n\n---\n\n"  # ページ区切りを追加
                md_txt += page_md

            return md_txt
        except Exception as e:
            logging.error(f"PDF→マークダウン変換中にエラーが発生しました: {str(e)}")
            return "エラー"

    def process_document(self, blob_stream: bytes, file_extension: str) -> str:
        """
        ドキュメントをマークダウンに変換するメインメソッド

        Args:
            blob_stream: ドキュメントデータを含むバイトストリーム
            file_extension: ファイルの拡張子（.pdf, .jpg, .pngなど）

        Returns:
            str: マークダウン形式のテキスト、エラー時は"エラー"
        """
        try:
            if file_extension == ".pdf":
                return self.pdf_to_markdown(blob_stream)
            # elif file_extension in [".jpg", ".jpeg", ".png", ".gif", ".bmp"]:
            #     img = Image.open(io.BytesIO(blob_stream))
            #     return self.image_to_markdown(img)
            else:
                logging.warning(f"サポートされていないファイル形式: {file_extension}")
                return "エラー: サポートされていないファイル形式です"
        except Exception as e:
            logging.error(f"ドキュメント処理中にエラーが発生しました: {str(e)}")
            return "エラー"

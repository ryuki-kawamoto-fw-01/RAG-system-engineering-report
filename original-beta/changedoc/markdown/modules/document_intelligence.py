import logging
import os

from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
from azure.identity import DefaultAzureCredential

# 環境変数
AZURE_DI_DST_ENDPOINT_ENV = "AZURE_DI_DST_ENDPOINT"


class DocumentIntelligenceSample:
    def __init__(self):
        self.endpoint = os.environ.get(AZURE_DI_DST_ENDPOINT_ENV, "")
        self.credential = DefaultAzureCredential()
        self.client = DocumentIntelligenceClient(
            endpoint=self.endpoint,
            credential=self.credential,
        )

    def exec(self, downloaded_blob):
        try:
            # Blob の内容を読み取る
            blob_content = downloaded_blob.readall()

            # AnalyzeDocumentRequest オブジェクトを作成
            analyze_request = AnalyzeDocumentRequest(bytes_source=blob_content)

            # ドキュメントを解析
            poller = self.client.begin_analyze_document(
                "prebuilt-layout",
                analyze_request,
                output_content_format="markdown",
            )
            result = poller.result()

            # result の内容をログに出力
            logging.info(f"解析結果: {result.content}")

            # マークダウン形式の出力を取得
            full_text = result.content
            logging.info(f"ドキュメントインテリジェンス処理成功\n")
            return full_text
        except Exception as e:
            logging.error(f"ドキュメントインテリジェンス処理失敗\n")
            logging.error(e, exc_info=True)
            return "エラー"

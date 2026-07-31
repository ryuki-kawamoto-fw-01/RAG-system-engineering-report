import os
import logging
import json
from typing import List, Optional

from azure.ai.projects import AIProjectClient
from modules.specification.prompt import (
    TABLE_RECORD_JKS,
    TABLE_RECORD_TTS,
    get_table_search_prompt_jks,
    get_table_search_prompt_tts,
)
from modules.service import AzureStorageService
from modules.agent.model import AISearchResponse, AISearchSegment, Citation
from modules.specification.model import TableSearchCombinedResponse


# テーブル検索 # ユーザーの質問文から、テーブルレコード内で関連するファイルを特定し、ファイル情報を返す
class TableSearchTool:
    def __init__(
        self,
        client: AIProjectClient,
        model: str,
        srcfile_container: AzureStorageService,
        markdown_container: AzureStorageService,
        tts_prefix: str,
        jks_prefix: str,
    ):
        """
        :param client: project_client
        :param model: 利用するモデル名（例："gpt-5.2" など）
        """
        self.client = client
        self.model = model
        self.srcfile_container = srcfile_container
        self.markdown_container = markdown_container
        self.tts_prefix = tts_prefix
        self.jks_prefix = jks_prefix

    def table_search(self, query: str, desc: str) -> str:
        """
        ユーザーの質問（query）から、JKSテーブルレコード内で関連するファイルを特定します。

        :param query: ユーザーの質問。例："自動車の窓ガラスについて教えて"
        :param desc: ユーザーに説明するメッセージです。JKSテーブル検索の意図を説明して
        :return: 取得結果をJSON形式で出力
        """
        logging.info("jks_table_search called with query: %s", query)

        # JKSに対するテーブル検索を実行
        prompt = get_table_search_prompt_jks(query, TABLE_RECORD_JKS)
        result = self._execute_table_search(prompt)
        jks_files = self.srcfile_container.list_files(self.jks_prefix)

        # 検索結果をセグメントに変換
        jks_segments = self._results_to_segments(result.get("results", []), jks_files)

        # TTSに対するテーブル検索を実行
        prompt = get_table_search_prompt_tts(query, TABLE_RECORD_TTS)
        result = self._execute_table_search(prompt)
        tts_files = self.srcfile_container.list_files(self.tts_prefix)

        # 検索結果をセグメントに変換
        tts_segments = self._results_to_segments(result.get("results", []), tts_files)

        segments = jks_segments + tts_segments
        return AISearchResponse(segments=segments).model_dump_json()

    def _execute_table_search(self, prompt: str) -> dict:
        """
        テーブル検索を実行する内部メソッド

        :param prompt: LLMに送信するプロンプト
        :return: 検索結果の辞書
        """
        # LLMクライアントを取得
        inference_client = self.client.inference.get_azure_openai_client(
            api_version="2024-12-01-preview"
        )

        # LLMに問い合わせを行い結果を取得
        response = inference_client.beta.chat.completions.parse(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format=TableSearchCombinedResponse,
        )

        # JSONレスポンスをパース
        content = response.choices[0].message.content
        if content is None:
            raise ValueError("Response content is None and cannot be parsed as JSON.")
        result = json.loads(content)
        return result

    def _results_to_segments(
        self, results: list, all_file_list: List[str]
    ) -> List[AISearchSegment]:
        """
        検索結果をAISearchSegmentのリストに変換する内部メソッド

        :param results: テーブル検索の結果リスト
        :param all_file_list: すべてのファイルのリスト.ファイル名からファイルパスを対応つけるために利用
        :return: AISearchSegmentのリスト
        """
        segments = []
        for item in results:
            # ドキュメント番号を取得
            file_key = item.get("document_number")
            if not file_key:
                logging.error("ドキュメント番号が見つかりません")
                continue

            # ファイルパスを取得
            file_path = self._get_filepath(file_key, all_file_list)
            if not file_path:
                logging.warning(f"ファイル {file_key} のパスが見つかりません")
                continue

            # マークダウンコンテンツを取得
            content = "\n".join(self._get_markdowns(file_path))

            # セグメントを作成
            seg = AISearchSegment(
                text=content,
                citation=[
                    Citation(
                        search_title=os.path.basename(file_path),
                        search_path=file_path,
                    )
                ],
            )
            segments.append(seg)

        return segments

    def _get_filepath(self, key, file_list: List[str]) -> Optional[str]:
        matched = [x for x in file_list if key in os.path.basename(x)]
        if matched:
            return matched[0]
        return None

    def _get_markdowns(self, src_file_path: str) -> List[str]:
        """
        指定されたファイルに対応するパース済みのすべてのマークダウンコンテンツを取得します。

        :param src_file_path: 参照元のファイルパス
        :return: マークダウンテキストのリスト
        """
        dirname = os.path.dirname(src_file_path)
        base_name = os.path.splitext(os.path.basename(src_file_path))[0]
        markdown_prefix = f"{dirname}/{base_name}/{base_name}-"
        markdown_files = self.markdown_container.list_files(markdown_prefix)
        markdown_contents = []
        for filename in markdown_files:
            content = self.markdown_container.read_file(filename).decode("utf-8")
            markdown_contents.append(content)
        return markdown_contents

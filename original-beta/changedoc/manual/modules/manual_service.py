import hashlib
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from modules.utils.blob_utils import (
    create_container_client,
    download_blob_content,
    upload_content_to_blob,
)
from modules.utils.document_generators import (
    create_excel_with_layout,
    create_markdown_with_table,
    create_word_with_layout,
)

from .manual_models import (
    ManualStep,
    UpdateManualRequest,
    UpdateManualResponse,
    ErrorResponse,
    ExtractEditingDataResponse,
    EditingData,
)


class ManualService:
    """マニュアル編集に関するビジネスロジックを処理するサービスクラス"""

    def __init__(self):
        pass

    def extract_editing_data(
        self, llm_output_url: str, keyframes_urls: List[str]
    ) -> ExtractEditingDataResponse:
        """マニュアル作成結果から編集画面用のデータを抽出する

        Args:
            llm_output_url: LLM出力結果のJSONファイルURL
            keyframes_urls: キーフレーム画像URLのリスト

        Returns:
            編集画面用のデータ構造
        """
        try:
            # LLM出力結果を取得
            try:
                json_content = download_blob_content(llm_output_url)
                llm_data = json.loads(json_content)
                # 辞書の場合はリストに変換
                if isinstance(llm_data, dict):
                    llm_data = [llm_data]
                else:
                    pass

            except Exception as e:
                return ExtractEditingDataResponse(
                    success=False,
                    message="マニュアルデータの取得に失敗しました",
                    data=None,
                )

            # ステップデータに変換
            steps = self._convert_to_manual_steps(llm_data, keyframes_urls)

            # レスポンスを構築
            editing_data = EditingData(
                steps=steps,
                frameUrls=keyframes_urls,
                totalFrames=len(keyframes_urls),
                manualId=self._generate_manual_id_from_data(llm_data),
            )

            return ExtractEditingDataResponse(
                success=True,
                message="編集データを正常に抽出しました",
                data=editing_data,
            )

        except Exception as e:
            return ExtractEditingDataResponse(
                success=False,
                message="編集データの抽出中にエラーが発生しました",
                data=None,
            )

    def _convert_to_manual_steps(
        self, llm_data: List[Dict], keyframes_urls: List[str] = None
    ) -> List[ManualStep]:
        """
        LLM出力データをManualStepリストに変換する

        Args:
            llm_data: LLM出力データのリスト
            keyframes_urls: キーフレームURLのリスト
        """
        # ...debug log removed...
        steps = []

        for i, item in enumerate(llm_data):
            try:
                # frameIdxを計算（keyframes_urlsとのマッチングで正確なインデックスを取得）
                image_path = item.get("image", item.get("image_path", ""))
                frame_idx = self._find_frame_idx_from_keyframes_urls(
                    image_path, keyframes_urls, i
                )
                description = item.get("text", item.get("response", f"手順 {i + 1}"))

                # frameIdxが適切な範囲内にあることを確認
                if frame_idx < 0:
                    frame_idx = i
                elif keyframes_urls and frame_idx >= len(keyframes_urls):
                    frame_idx = min(i, len(keyframes_urls) - 1)

                # 説明文が複数ステップを含んでいる場合は分割
                split_steps = self._split_description_into_steps(
                    description, frame_idx, i
                )
                if len(split_steps) > 1:
                    for step_idx, split_desc in enumerate(split_steps):
                        step = ManualStep(
                            id=len(steps) + 1,
                            frameIdx=frame_idx,
                            description=split_desc.strip(),
                        )
                        steps.append(step)
                else:
                    step = ManualStep(
                        id=i + 1,
                        frameIdx=frame_idx,
                        description=description,
                    )
                    steps.append(step)
            except Exception as e:
                # フォールバック用のステップを作成
                fallback_step = ManualStep(
                    id=i + 1, frameIdx=i, description=f"手順 {i + 1}"
                )
                steps.append(fallback_step)

        return steps

    def _split_description_into_steps(
        self, description: str, base_frame_idx: int, item_idx: int
    ) -> List[str]:
        """説明文を複数ステップに分割する"""
        try:

            # 番号付きリスト形式を検出して分割
            # パターン1: "1. xxx\n2. yyy" 形式（改行あり）
            numbered_pattern = r"\d+\.\s+[^\n\d]+(?=\n\d+\.|$)"
            numbered_matches = re.findall(numbered_pattern, description, re.MULTILINE)

            # パターン2: "1. xxx 2. yyy" 形式（同一行）
            if not numbered_matches:
                inline_pattern = r"\d+\.\s+[^\d]+?(?=\s*\d+\.|$)"
                numbered_matches = re.findall(inline_pattern, description)

            if len(numbered_matches) > 1:
                # 番号を除去して説明文のみを抽出
                cleaned_steps = []
                for i, match in enumerate(numbered_matches):
                    # "1. " などの番号部分を除去
                    clean_step = re.sub(r"^\d+\.\s+", "", match).strip()
                    if clean_step:
                        cleaned_steps.append(clean_step)
                return cleaned_steps

            # パターン3: 改行区切りで複数文がある場合
            lines = [line.strip() for line in description.split("\n") if line.strip()]
            if len(lines) > 1:
                return lines

            # パターン4: 文の区切りで分割（句点で区切る）
            sentences = [s.strip() for s in description.split("。") if s.strip()]
            if len(sentences) > 1 and any(
                len(s) > 10 for s in sentences
            ):
                # 最後の要素が空文字でない場合は「。」を付け直す
                formatted_sentences = []
                for i, sentence in enumerate(sentences):
                    if sentence:
                        if i < len(sentences) - 1 or not description.endswith("。"):
                            formatted_sentences.append(sentence + "。")
                        else:
                            formatted_sentences.append(sentence)
                if len(formatted_sentences) > 1:
                    return formatted_sentences

        except Exception as e:
            pass

        # 分割できない場合は元の説明をそのまま返す
        return [description]

    def _extract_frame_idx_from_image_path(
        self, image_path: str, default_idx: int
    ) -> int:
        """画像パスからフレームインデックスを抽出する"""
        try:
            # 画像パスから番号を抽出（例: keyframe_001.png -> 1）

            # パターン1: keyframe_001.png形式
            match = re.search(r"keyframe_(\d+)", image_path)
            if match:
                frame_num = int(match.group(1))
                # 0ベースのインデックスに変換（001 -> 0, 002 -> 1）
                frame_idx = frame_num - 1
                return max(0, frame_idx)  # 負の値を防止

            # パターン2: 他の数字パターンを試行
            match = re.search(r"(\d+)", image_path)
            if match:
                frame_num = int(match.group(1))
                frame_idx = (
                    frame_num if frame_num < 100 else default_idx
                )  # 大きすぎる数字は除外
                return max(0, frame_idx)

            return max(0, default_idx)
        except Exception as e:
            return max(0, default_idx)

    def _find_frame_idx_from_keyframes_urls(
        self, image_path: str, keyframes_urls: List[str], default_idx: int
    ) -> int:
        """
        keyframes_urlsとimage_pathをマッチングしてframeIdxを取得する

        Args:
            image_path: LLMデータの画像パス
            keyframes_urls: キーフレームURLのリスト
            default_idx: デフォルトのインデックス

        Returns:
            マッチしたキーフレームのインデックス
        """
        try:
            if not image_path or not keyframes_urls:
                return default_idx


            # image_pathからファイル名を抽出
            image_filename = os.path.basename(image_path)

            # keyframes_urlsから同じファイル名を探す
            for idx, url in enumerate(keyframes_urls):
                url_filename = url.split("/")[-1].split("?")[0]  # SASトークンを除去

                if image_filename and image_filename.lower() == url_filename.lower():
                    return idx

            # 完全一致しない場合、パターンマッチングを試行
            for idx, url in enumerate(keyframes_urls):
                url_filename = url.split("/")[-1].split("?")[0]

                # keyframe番号でマッチング
                image_match = re.search(
                    r"keyframe[_-]?(\d+)", image_filename, re.IGNORECASE
                )
                url_match = re.search(
                    r"keyframe[_-]?(\d+)", url_filename, re.IGNORECASE
                )

                if image_match and url_match:
                    if image_match.group(1) == url_match.group(1):
                        return idx

            # フォールバック: image_pathから番号を抽出してframeIdxとして使用
            frame_idx = self._extract_frame_idx_from_image_path(image_path, default_idx)
            if frame_idx != default_idx and 0 <= frame_idx < len(keyframes_urls):
                return frame_idx

            return (
                min(default_idx, len(keyframes_urls) - 1)
                if keyframes_urls
                else default_idx
            )

        except Exception as e:
            return (
                min(default_idx, len(keyframes_urls) - 1)
                if keyframes_urls
                else default_idx
            )

    def _generate_manual_id_from_data(self, llm_data: List[Dict]) -> str:
        """LLMデータからマニュアルIDを生成する"""
        # データのハッシュ値とタイムスタンプでIDを生成
        data_str = json.dumps(llm_data, sort_keys=True)
        hash_value = hashlib.md5(data_str.encode()).hexdigest()[:8]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

        return f"manual_{timestamp}_{hash_value}"

    def update_manual(self, request: UpdateManualRequest) -> UpdateManualResponse:
        """マニュアルを更新する

        Args:
            request: 更新リクエスト

        Returns:
            更新結果
        """
        try:
            # バリデーション
            validation_error = self._validate_request(request)
            if validation_error:
                return UpdateManualResponse(
                    success=False,
                    message=validation_error,
                    steps=None,
                )

            # マニュアル更新処理
            # ここではモック実装として、受信したデータをそのまま返す
            # 実際の実装では、Cosmos DBなどのデータストアに保存する

            # TODO: 実際のデータベース更新処理を実装
            # - Cosmos DBにマニュアルデータを保存
            # - 既存データの更新または新規作成

            updated_steps = self._process_steps(request.steps)


            return UpdateManualResponse(
                success=True,
                message="マニュアルが正常に更新されました",
                steps=updated_steps,
            )

        except Exception as e:
            return UpdateManualResponse(
                success=False,
                message="内部エラーが発生しました",
                steps=None,
            )

    def _validate_request(self, request: UpdateManualRequest) -> str:
        """リクエストのバリデーションを行う

        Args:
            request: バリデーション対象のリクエスト

        Returns:
            エラーメッセージ（エラーがない場合は空文字列）
        """
        if not request.manualId:
            return "manualIdは必須です"

        if not request.steps:
            return "stepsは必須です"

        for i, step in enumerate(request.steps):
            if not isinstance(step.id, int) or step.id <= 0:
                return f"steps[{i}].idは正の整数である必要があります"

            if not isinstance(step.frameIdx, int) or step.frameIdx < 0:
                return f"steps[{i}].frameIdxは0以上の整数である必要があります"

            if not step.description or not step.description.strip():
                return f"steps[{i}].descriptionは必須です"

        return ""

    def _process_steps(self, steps: List[ManualStep]) -> List[ManualStep]:
        """ステップデータを処理する

        Args:
            steps: 処理対象のステップリスト

        Returns:
            処理済みのステップリスト
        """
        # ここでは基本的な処理として、説明文の前後の空白を除去
        processed_steps = []
        for step in steps:
            processed_step = ManualStep(
                id=step.id, frameIdx=step.frameIdx, description=step.description.strip()
            )
            processed_steps.append(processed_step)

        # IDでソート
        processed_steps.sort(key=lambda x: x.id)

        return processed_steps

    def _create_error_response(self, error_type: str, message: str) -> Dict[str, Any]:
        """エラーレスポンスを作成する

        Args:
            error_type: エラータイプ
            message: エラーメッセージ

        Returns:
            エラーレスポンスの辞書
        """
        response = ErrorResponse(success=False, error=error_type, message=message)
        return self._dataclass_to_dict(response)

    def _dataclass_to_dict(self, obj: Any) -> Dict[str, Any]:
        """データクラスを辞書に変換する

        Args:
            obj: 変換対象のデータクラスオブジェクト

        Returns:
            変換された辞書
        """
        if hasattr(obj, "__dataclass_fields__"):
            result = {}
            for field_name, field in obj.__dataclass_fields__.items():
                value = getattr(obj, field_name)
                if isinstance(value, list):
                    result[field_name] = [
                        self._dataclass_to_dict(item) for item in value
                    ]
                elif hasattr(value, "__dataclass_fields__"):
                    result[field_name] = self._dataclass_to_dict(value)
                else:
                    result[field_name] = value
            return result
        return obj

    def _extract_container_from_url(self, url: str) -> str:
        """ブロブURLからコンテナ名を抽出"""
        try:
            # https://storage.blob.core.windows.net/container-name/path形式からコンテナ名を抽出
            parsed = urlparse(url)
            path_parts = parsed.path.strip("/").split("/")
            return path_parts[0] if path_parts else "unknown"
        except:
            return "unknown"

    def _extract_folder_path_from_keyframes(self, keyframes_urls: List[str]) -> str:
        """キーフレームURLからフォルダパスを抽出"""
        try:
            if not keyframes_urls:
                return ""

            parsed = urlparse(keyframes_urls[0])
            path_parts = parsed.path.strip("/").split("/")
            # コンテナ名を除いてフォルダパスを取得
            if len(path_parts) >= 2:
                return "/".join(path_parts[1:-1]) + "/"
            return ""
        except:
            return ""

    def update_manual_files(self, request: UpdateManualRequest) -> Dict[str, str]:
        """
        マニュアルファイル（JSON、Excel、Word、Markdown）を更新

        Args:
            request: 更新リクエスト

        Returns:
            更新されたファイルのURL辞書
        """
        try:
            # コンテナクライアントを作成
            if not request.container_name:
                raise ValueError("containerNameが指定されていません")

            container_client = create_container_client(request.container_name)

            # 更新されたファイルURLを保存
            updated_files = {}

            # 1. JSONファイルの更新
            json_url = self._update_json_file(container_client, request)
            if json_url:
                updated_files["jsonFileURL"] = json_url

            # 2. Excelファイルの更新
            excel_url = self._update_excel_file(container_client, request)
            if excel_url:
                updated_files["excelFileURL"] = excel_url

            # 3. Wordファイルの更新
            word_url = self._update_word_file(container_client, request)
            if word_url:
                updated_files["wordFileURL"] = word_url

            # 4. Markdownファイルの更新
            markdown_url = self._update_markdown_file(container_client, request)
            if markdown_url:
                updated_files["markdownFileURL"] = markdown_url

            return updated_files

        except Exception as e:
            raise

    def _update_json_file(
        self, container_client, request: UpdateManualRequest
    ) -> Optional[str]:
        """JSONファイルを更新"""
        try:
            # ステップデータをJSONに変換
            steps_data = []
            for step in request.steps:
                steps_data.append(
                    {
                        "id": step.id,
                        "frameIdx": step.frameIdx,
                        "description": step.description,
                    }
                )

            json_data = {
                "manualId": request.manual_id,
                "updatedAt": datetime.now().isoformat(),
                "steps": steps_data,
                "frameUrls": request.frame_urls,
                "totalSteps": len(steps_data),
                "metadata": {
                    "containerName": request.container_name,
                    "folderPath": request.folder_path,
                    "blobFolderName": request.blob_folder_name,
                },
            }

            # JSONファイルのパスを決定
            json_blob_name = (
                f"{request.blob_folder_name}/manual_data.json"
                if request.blob_folder_name
                else "manual_data.json"
            )

            # Blobにアップロード
            json_content = json.dumps(json_data, ensure_ascii=False, indent=2)
            upload_content_to_blob(
                container_client=container_client,
                blob_name=json_blob_name,
                content=json_content,
                content_type="application/json",
            )

            # URLを生成
            storage_account = os.environ.get("AZURE_STORAGE_ACCOUNT_NAME")
            json_url = f"https://{storage_account}.blob.core.windows.net/{request.container_name}/{json_blob_name}"

            return json_url

        except Exception as e:
            return None

    def _update_excel_file(
        self, container_client, request: UpdateManualRequest
    ) -> Optional[str]:
        """Excelファイルを更新"""
        try:
            if not request.excel_file_url:
                return None

            # 既存のExcelファイルのBlob名を取得
            excel_blob_name = self._extract_blob_name_from_url(request.excel_file_url)
            if not excel_blob_name:
                return None

            # 新しいExcelファイルを生成
            updated_excel_path = create_excel_with_layout(
                steps=request.steps,
                frame_urls=request.frame_urls,
                output_filename=f"updated_manual_{request.manual_id}.xlsx",
            )

            # Blobにアップロード（上書き）
            with open(updated_excel_path, "rb") as excel_file:
                container_client.upload_blob(
                    name=excel_blob_name,
                    data=excel_file,
                    overwrite=True,
                    content_settings={
                        "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    },
                )

            # 一時ファイルを削除
            Path(updated_excel_path).unlink(missing_ok=True)

            return request.excel_file_url

        except Exception as e:
            return None

    def _update_word_file(
        self, container_client, request: UpdateManualRequest
    ) -> Optional[str]:
        """Wordファイルを更新"""
        try:
            if not request.word_file_url:
                return None

            word_blob_name = self._extract_blob_name_from_url(request.word_file_url)
            if not word_blob_name:
                return None

            # 新しいWordファイルを生成
            updated_word_path = create_word_with_layout(
                steps=request.steps,
                frame_urls=request.frame_urls,
                output_filename=f"updated_manual_{request.manual_id}.docx",
            )

            # Blobにアップロード（上書き）
            with open(updated_word_path, "rb") as word_file:
                container_client.upload_blob(
                    name=word_blob_name,
                    data=word_file,
                    overwrite=True,
                    content_settings={
                        "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    },
                )

            # 一時ファイルを削除
            Path(updated_word_path).unlink(missing_ok=True)

            return request.word_file_url

        except Exception as e:
            return None

    def _update_markdown_file(
        self, container_client, request: UpdateManualRequest
    ) -> Optional[str]:
        """Markdownファイルを更新"""
        try:
            if not request.markdown_file_url:
                return None

            markdown_blob_name = self._extract_blob_name_from_url(
                request.markdown_file_url
            )
            if not markdown_blob_name:
                return None

            # 新しいMarkdownファイルを生成
            updated_markdown_path = create_markdown_with_table(
                steps=request.steps,
                frame_urls=request.frame_urls,
                output_filename=f"updated_manual_{request.manual_id}.md",
            )

            # Blobにアップロード（上書き）
            with open(updated_markdown_path, "r", encoding="utf-8") as md_file:
                markdown_content = md_file.read()

            upload_content_to_blob(
                container_client=container_client,
                blob_name=markdown_blob_name,
                content=markdown_content,
                content_type="text/markdown",
            )

            # 一時ファイルを削除
            Path(updated_markdown_path).unlink(missing_ok=True)

            return request.markdown_file_url

        except Exception as e:
            return None

    def _extract_blob_name_from_url(self, url: str) -> Optional[str]:
        """BlobストレージのURLからBlob名を抽出"""
        try:
            # https://storageaccount.blob.core.windows.net/container/blob/path/file.ext
            # の形式からblob/path/file.extを抽出
            parts = url.split("/")
            if len(parts) >= 5 and "blob.core.windows.net" in url:
                # コンテナ名以降のパスを結合
                blob_name = "/".join(parts[4:])
                return blob_name
            return None
        except Exception:
            return None

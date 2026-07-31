"""Functions to parse transcript and keyframe metadata from CU result contents."""

import concurrent.futures
import json
import logging
import re
from pathlib import Path
from typing import Any

from modules.content_understanding_module.content_understanding import (
    AzureContentUnderstandingClient,
    get_content_understanding_images,
)
from modules.manual_models import Content, SegmentTranscriptData

logger = logging.getLogger(__name__)


def extract_transcripts_fields_keyframes(
    contents: list[Content],
) -> dict[str, SegmentTranscriptData]:
    """
    Content Understandingの結果コンテンツから、トランスクリプト、フィールド、キーフレームを抽出します。

    Args:
        contents (list[Content]): Content Understandingの結果に含まれる 'contents' リスト（Pydanticモデル）。

    Returns:
        dict[str, SegmentTranscriptData]: 各キーが "Segment-{index}" であり、値がSegmentTranscriptDataモデルのインスタンス。
    """
    result: dict[str, SegmentTranscriptData] = {}
    for content in contents:

        markdown = content.markdown
        segment_fields = content.fields["Segments"]["valueArray"]
        segment_sections = re.split(r"## Segment ", markdown)[1:]

        for segment_index, (segment_field, segment_section) in enumerate(
            zip(segment_fields, segment_sections)
        ):
            dict_key = f"Segment-{segment_index}"

            sections = re.split("```\n\nKey Frames", segment_section)
            keyframes_section = sections[-1]
            transcript_section = re.split("\n\nTranscript", sections[0])[-1]

            speaker_matches = re.findall(
                r"<Speaker\s+(\d+)>([^\n]*)", transcript_section
            )
            transcript = [t for _, t in speaker_matches]

            keyframes = []
            keyframes_section_lines = keyframes_section.splitlines()
            logger.info(
                json.dumps(
                    {
                        "event": "segment.keyframes.parse",
                        "segment_index": segment_index,
                        "keyframes_section_line_count": len(keyframes_section_lines),
                        "keyframes_section_preview": keyframes_section[:200],
                    },
                    ensure_ascii=False,
                )
            )

            for line_idx, line in enumerate(keyframes_section_lines):
                m = re.match(
                    r"- (\d{2}):(\d{2})\.(\d{3}) !\[\]\((keyFrame\.\d+\.jpg)\)", line
                )
                if m:
                    filename = m.group(4)
                    keyframes.append(filename)

            logger.info(
                json.dumps(
                    {
                        "event": "segment.keyframes.extracted",
                        "segment_index": segment_index,
                        "keyframes_count": len(keyframes),
                        "keyframes": keyframes,
                    },
                    ensure_ascii=False,
                )
            )

            # キーフレームが0個のセグメントは除外
            if len(keyframes) == 0:
                logger.warning(
                    json.dumps(
                        {
                            "event": "segment.keyframes.skipped",
                            "segment_index": segment_index,
                            "segment_key": dict_key,
                            "reason": "No keyframes found in this segment",
                        },
                        ensure_ascii=False,
                    )
                )
                continue

            field_texts = segment_field["valueObject"]["procedure"]["valueString"]
            # keyframesの真ん中の要素を取得
            middle_idx = len(keyframes) // 2
            middle_keyframe = keyframes[middle_idx]
            
            result[dict_key] = SegmentTranscriptData(
                transcript=transcript,
                fields=field_texts,
                keyframes=keyframes,
                keyframe=middle_keyframe,
            )
    return result


def get_images_from_content_understanding_result(
    temp_dir: str,
    container_name: str,
    blob_folder_name: str,
    client: AzureContentUnderstandingClient,
    operationId: str,
    transcripts_fields_keyframes: dict[str, SegmentTranscriptData],
) -> list[list[str]]:
    """
    Content Understandingの結果からキーフレーム画像を取得する関数
    取得した画像は、一時ディレクトリに保存され、Azure Blob Storageにもアップロードされる

    Args:
        temp_dir (str): 一時ディレクトリのパス
        container_name (str): Azure Blob Storageのコンテナ名
        blob_folder_name (str): Blob内のフォルダ名
        client (AzureContentUnderstandingClient): Content Understandingクライアントインスタンス
        operationId (str): Content UnderstandingのID
        transcripts_fields_keyframes (dict): トランスクリプト、フィールド、キーフレーム情報を含む辞書

    Returns:
        list[list[str]]: 各ショットのキーフレーム画像パスのリスト
    """
    image_paths_list: list[list[str]] = []
    image_file_output_dir = Path(temp_dir, "keyframes")

    for shot_index, tfk in enumerate(transcripts_fields_keyframes.values()):
        keyframes: list[str] = tfk.keyframes
        # keyframes の順序を保持するためプレースホルダ確保
        shot_image_paths: list[str] = [""] * len(keyframes)

        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_map = {
                executor.submit(
                    get_content_understanding_images,
                    keyframe,
                    operationId,
                    client,
                    container_name,
                    f"{blob_folder_name}/keyframes/{shot_index}/{keyframe}",
                    str(image_file_output_dir),
                ): k_idx
                for k_idx, keyframe in enumerate(keyframes)
            }
            for future in concurrent.futures.as_completed(future_map):
                k_idx = future_map[future]
                shot_image_paths[k_idx] = future.result()

        image_paths_list.append(shot_image_paths)
    return image_paths_list

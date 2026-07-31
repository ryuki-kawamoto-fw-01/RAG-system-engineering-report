import json
import os
import sys
import tempfile
import time
import traceback
import uuid
from datetime import datetime
from logging import INFO, Logger, StreamHandler, getLogger
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

sys.path.append(os.path.join(os.path.dirname(__file__), "modules"))

import azure.durable_functions as df  # type: ignore[import]
import azure.functions as func  # type: ignore[import]
from dotenv import load_dotenv
from modules.manual_models import (
    CreateManualRequest,
    ManualStep,
    ManualStepInput,
    SaveManualRequest,
    first_validation_error_message,
)
from pydantic import ValidationError
from modules.content_understanding_module.content_understanding import (
    create_content_understanding_client,
    get_content_understanding_result,
)
from modules.content_understanding_module.data_extraction import (
    extract_transcripts_fields_keyframes,
    get_images_from_content_understanding_result,
)
from modules.utils.blob_utils import (
    download_blob,
    download_file_from_blob,
    generate_read_sas_url,
    generate_write_sas_url,
    get_keyframe_urls_from_container,
    upload_content_to_blob,
    upload_file_to_blob,
)
from modules.image_module.keypoint_extractor import extract_keypoints_from_video
from modules.llm_module.llm_runner import describe_keyframes
from modules.utils.document_generators import (
    update_docx,
    update_excel,
    update_markdown,
    update_json,
)
from dataclasses import asdict

# 環境変数を起動時にロード
load_dotenv()

app = df.DFApp(http_auth_level=func.AuthLevel.FUNCTION)

FILE_PREFIX = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
TEMP_DIR = "tmp"

logger: Logger = getLogger(__name__)
handler = StreamHandler()
handler.setLevel(INFO)
logger.setLevel(INFO)
logger.addHandler(handler)
# logger.propagate = False  # ルートロガー経由でのコンソール出力を遮断


@app.route(route="ideathon_content_understanding_fn")
@app.durable_client_input(client_name="client")
async def http_start(req: func.HttpRequest, client):
    payload = req.get_json()
    instance_id = await client.start_new(
        "manual_output_orchestrator", client_input=payload
    )
    response = client.create_check_status_response(req, instance_id)

    return response


@app.orchestration_trigger(context_name="context")
def manual_output_orchestrator(context):
    payload = context.get_input()
    correlation_id = str(uuid.uuid4())
    logger.info(
        json.dumps(
            {
                "event": "orchestrator.start",
                "correlation_id": correlation_id,
                "payload_keys": (
                    list(payload.keys()) if isinstance(payload, dict) else None
                ),
            },
            ensure_ascii=False,
        )
    )

    if isinstance(payload, dict):
        payload["correlation_id"] = correlation_id
    else:
        payload = {"raw": payload, "correlation_id": correlation_id}

    result = yield context.call_activity("create_manual", json.dumps(payload))

    logger.info(
        json.dumps(
            {
                "event": "orchestrator.completed",
                "correlation_id": correlation_id,
            },
            ensure_ascii=False,
        )
    )
    return result

@app.activity_trigger(input_name="request")
def create_manual(request: str) -> dict[str, str]:
    """
    指定された動画URLを処理し、キーポイント抽出を使用して手順書を生成してAzure Blob Storageに保存する関数

    Args:
        url (str): 処理対象の動画のURL

    Returns:
        Response: JSON形式で、生成されたExcel/Word/Markdownファイルの名前を含む辞書

    Raises:
        ValueError: URLが無効な場合
        Exception: その他の処理中のエラー
    """
    correlation_id = "unknown"
    try:
        payload = json.loads(request)
        correlation_id = payload.get("correlation_id", str(uuid.uuid4()))
        validated_request = CreateManualRequest.model_validate(payload)
    except (ValidationError, json.JSONDecodeError) as e:
        error_msg = first_validation_error_message(e)
        logger.error(f"❌ {error_msg}: correlation_id={correlation_id}")
        return {
            "error": "VALIDATION_ERROR",
            "message": error_msg,
            "correlation_id": correlation_id,
        }

    url = validated_request.url

    logger.info(
        json.dumps(
            {
                "event": "create_manual.input",
                "correlation_id": correlation_id,
                "url": url,
            },
            ensure_ascii=False,
        )
    )

    total_start_time = time.time()
    logger.info(
        json.dumps(
            {"event": "create_manual.start", "correlation_id": correlation_id},
            ensure_ascii=False,
        )
    )

    temp_dir = tempfile.gettempdir()
    # 動画のURLから指定の形式に変換
    # Blob URLから"container/blobpath/filename.mp4"形式に変換
    # 例: https://<account>.blob.core.windows.net/<container>/<blobpath>/filename.mp4
    parsed_url = urlparse(url)
    container_name, video_blob_name = parsed_url.path.lstrip("/").split("/", 1)
    blob_folder_name = video_blob_name.split("/")[0]
    logger.info(
        json.dumps(
            {
                "event": "video.resolve",
                "correlation_id": correlation_id,
                "container_name": container_name,
                "parsed_url": str(parsed_url),
                "blob_folder_name": blob_folder_name,
                "video_blob_name": video_blob_name,
            },
            ensure_ascii=False,
        )
    )
    try:
        # 1. 動画ファイルをダウンロード
        video_download_start = time.time()
        video_output_dir = Path(temp_dir) / "video_download"
        video_output_dir.mkdir(parents=True, exist_ok=True)
        local_video_path = download_file_from_blob(
            container_name, video_blob_name, str(video_output_dir)
        )
        video_download_elapsed = time.time() - video_download_start
        logger.info(
            json.dumps(
                {
                    "event": "video.downloaded",
                    "correlation_id": correlation_id,
                    "local_path": local_video_path,
                    "elapsed_sec": round(video_download_elapsed, 2),
                },
                ensure_ascii=False,
            )
        )

        # 2. キーポイント抽出（デフォルト設定で自動閾値調整）
        keypoint_extraction_start = time.time()
        keypoints_output_dir = Path(temp_dir) / f"{blob_folder_name}_keypoints"
        
        logger.info(
            json.dumps(
                {
                    "event": "keypoint_extraction.start",
                    "correlation_id": correlation_id,
                    "output_dir": str(keypoints_output_dir),
                },
                ensure_ascii=False,
            )
        )
        
        all_frames, keypoints = extract_keypoints_from_video(
            video_path=local_video_path,
            output_dir=str(keypoints_output_dir),
            threshold=2.0,  # より高い閾値で変化が大きいフレームのみ抽出
            max_keypoints=30,  # 10枚ずつバッチ処理するので最大50枚まで対応（均等サンプリング）
            max_frames=50,
        )
        
        keypoint_extraction_elapsed = time.time() - keypoint_extraction_start
        logger.info(
            json.dumps(
                {
                    "event": "keypoint_extraction.completed",
                    "correlation_id": correlation_id,
                    "all_frames_count": len(all_frames),
                    "keypoints_count": len(keypoints),
                    "elapsed_sec": round(keypoint_extraction_elapsed, 2),
                },
                ensure_ascii=False,
            )
        )
        
        if len(keypoints) == 0:
            error_msg = (
                "動画からキーポイントを抽出できませんでした。"
                "動画が短すぎるか、視覚的な変化が少ない可能性があります。"
            )
            logger.error(
                json.dumps(
                    {
                        "event": "keypoints.validation_failed",
                        "correlation_id": correlation_id,
                        "total_keypoints": 0,
                        "error": error_msg,
                    },
                    ensure_ascii=False,
                )
            )
            return {
                "error": error_msg,
                "error_type": "NO_KEYPOINTS_DETECTED",
                "correlation_id": correlation_id,
            }

        # 3. 全キーフレーム画像をBlob Storageにアップロード
        blob_upload_start = time.time()
        keyframes_folder_path = f"{blob_folder_name}/keyframes/"
        keyframe_urls: list[str] = []
        keyframe_names: list[str] = []
        
        for idx, (frame_num, local_path) in enumerate(all_frames):
            # ファイル名を生成
            keyframe_filename = f"keyframe_{idx:04d}_frame{frame_num:06d}.jpg"
            blob_name = f"{keyframes_folder_path}{keyframe_filename}"
            
            # Blob Storageにアップロード
            blob_url = upload_file_to_blob(local_path, container_name, blob_name)
            
            # SAS URLを生成
            sas_url = generate_read_sas_url(container_name, blob_name)
            keyframe_urls.append(sas_url)
            keyframe_names.append(keyframe_filename)
            
            logger.info(
                json.dumps(
                    {
                        "event": "keyframe.uploaded",
                        "correlation_id": correlation_id,
                        "index": idx,
                        "frame_num": frame_num,
                        "blob_name": blob_name,
                    },
                    ensure_ascii=False,
                )
            )
        
        blob_upload_elapsed = time.time() - blob_upload_start
        logger.info(
            json.dumps(
                {
                    "event": "keyframes.upload_completed",
                    "correlation_id": correlation_id,
                    "total_keyframes": len(keyframe_urls),
                    "elapsed_sec": round(blob_upload_elapsed, 2),
                },
                ensure_ascii=False,
            )
        )

        # 4. LLMでキーフレームの説明を生成（キーポイントのみ）
        llm_description_start = time.time()
        keypoint_image_paths = [all_frames[kp_idx][1] for kp_idx, _, _ in keypoints]
        
        logger.info(
            json.dumps(
                {
                    "event": "llm_description.start",
                    "correlation_id": correlation_id,
                    "image_count": len(keypoint_image_paths),
                },
                ensure_ascii=False,
            )
        )
        
        # LLMからの結果: (description, skip, skip_reason) のタプルリスト
        llm_results = describe_keyframes(keypoint_image_paths)
        
        # スキップ判定のログ出力
        skip_count = sum(1 for _, skip, _ in llm_results if skip)
        logger.info(
            json.dumps(
                {
                    "event": "llm_skip_detection",
                    "correlation_id": correlation_id,
                    "total_keypoints": len(llm_results),
                    "skip_count": skip_count,
                    "skip_details": [
                        {"index": i, "reason": reason}
                        for i, (_, skip, reason) in enumerate(llm_results) if skip
                    ],
                },
                ensure_ascii=False,
            )
        )
        
        llm_description_elapsed = time.time() - llm_description_start
        logger.info(
            json.dumps(
                {
                    "event": "llm_description.completed",
                    "correlation_id": correlation_id,
                    "description_count": len(llm_results),
                    "elapsed_sec": round(llm_description_elapsed, 2),
                },
                ensure_ascii=False,
            )
        )

        # 5. ManualStepを作成（スキップされていないもののみ、frameIdxはall_framesのインデックスを参照）
        manual_steps: list[ManualStep] = []
        step_id = 1
        for (kp_idx, frame_num, hash_diff), (description, skip, skip_reason) in zip(keypoints, llm_results):
            if skip:
                logger.info(
                    json.dumps(
                        {
                            "event": "step.skipped",
                            "correlation_id": correlation_id,
                            "frame_idx": kp_idx,
                            "frame_num": frame_num,
                            "skip_reason": skip_reason,
                        },
                        ensure_ascii=False,
                    )
                )
                continue
            manual_steps.append(
                ManualStep(
                    id=step_id,
                    frameIdx=kp_idx,  # all_frames内のインデックス
                    description=description,
                )
            )
            step_id += 1

        logger.info(
            f"📊 Using update functions with {len(manual_steps)} manual steps (skipped: {skip_count})"
        )

        # 6. update関数を使用してファイル生成
        document_generation_start = time.time()
        excel_url = update_excel(
            manual_steps,
            keyframe_urls,
            container_name,
            blob_folder_name,
            correlation_id,
        )
        word_url = update_docx(
            manual_steps,
            keyframe_urls,
            container_name,
            blob_folder_name,
            correlation_id,
        )
        markdown_url = update_markdown(
            manual_steps,
            keyframe_urls,
            container_name,
            blob_folder_name,
            correlation_id,
        )
        document_generation_elapsed = time.time() - document_generation_start
        total_elapsed = time.time() - total_start_time
        logger.info(
            json.dumps(
                {
                    "event": "document_generation.completed",
                    "correlation_id": correlation_id,
                    "elapsed_sec": round(document_generation_elapsed, 2),
                },
                ensure_ascii=False,
            )
        )
        logger.info(
            json.dumps(
                {
                    "event": "create_manual.timing_summary",
                    "correlation_id": correlation_id,
                    "video_download_sec": round(video_download_elapsed, 2),
                    "keypoint_extraction_sec": round(keypoint_extraction_elapsed, 2),
                    "blob_upload_sec": round(blob_upload_elapsed, 2),
                    "llm_description_sec": round(llm_description_elapsed, 2),
                    "document_generation_sec": round(document_generation_elapsed, 2),
                    "total_elapsed_sec": round(total_elapsed, 2),
                },
                ensure_ascii=False,
            )
        )
    except Exception as e:
        logger.error(
            json.dumps(
                {
                    "event": "create_manual.error",
                    "correlation_id": correlation_id,
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                },
                ensure_ascii=False,
            )
        )
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "correlation_id": correlation_id,
        }

    editing_data = {
        "keyframesUrls": keyframe_urls,
        "steps": [asdict(m) for m in manual_steps],
        "frameUrls": keyframe_urls,
        "totalFrames": len(keyframe_urls),
        "containerName": container_name,
        "folderPath": keyframes_folder_path,
        "blobFolderName": blob_folder_name,
    }

    result = {
        "excelFileURL": excel_url,
        "wordFileURL": word_url,
        "markdownFileURL": markdown_url,
        "correlation_id": correlation_id,
        "editingData": editing_data,
    }

    return result

# この関数は、Content Understandingの結果からキーフレーム画像を取得し、Azure Blob Storageに保存するための関数です。
# 以下理由でもともとcreate_manualだったものを移行しました。
# - 5分の動画でも処理時間が20分以上かかる
# - 長い動画を解析させているときに他の動画を解析すると落ちて不安定
def create_manual_with_cu(request: str) -> dict[str, str]:
    """
    指定された動画URLを処理し、手順書を生成してAzure Blob Storageに保存する関数

    Args:
        url (str): 処理対象の動画のURL
        similarity_threshold (float): 類似度閾値（0.0〜1.0）
        is_auto_threshold (bool): 類似度閾値が有効かどうか

    Returns:
        Response: JSON形式で、生成されたExcelファイルの名前を含む辞書

    Raises:
        ValueError: URLが無効な場合、類似度閾値が不正な場合
        Exception: その他の処理中のエラー
    """
    correlation_id = "unknown"
    try:
        payload = json.loads(request)
        correlation_id = payload.get("correlation_id", str(uuid.uuid4()))
        validated_request = CreateManualRequest.model_validate(payload)
    except (ValidationError, json.JSONDecodeError) as e:
        error_msg = first_validation_error_message(e)
        logger.error(f"❌ {error_msg}: correlation_id={correlation_id}")
        return {
            "error": "VALIDATION_ERROR",
            "message": error_msg,
            "correlation_id": correlation_id,
        }

    url = validated_request.url
    is_auto_threshold = validated_request.is_auto_threshold

    logger.info(
        json.dumps(
            {
                "event": "create_manual.input",
                "correlation_id": correlation_id,
                "url": url,
                "is_auto_threshold": is_auto_threshold,
            },
            ensure_ascii=False,
        )
    )

    logger.info(
        json.dumps(
            {"event": "create_manual.start", "correlation_id": correlation_id},
            ensure_ascii=False,
        )
    )

    temp_dir = tempfile.gettempdir()
    # 動画のURLから指定の形式に変換
    # Blob URLから"container/blobpath/filename.mp4"形式に変換
    # 例: https://<account>.blob.core.windows.net/<container>/<blobpath>/filename.mp4
    parsed_url = urlparse(url)
    container_name, video_blob_name = parsed_url.path.lstrip("/").split("/", 1)
    blob_folder_name = video_blob_name.split("/")[0]
    logger.info(
        json.dumps(
            {
                "event": "video.resolve",
                "correlation_id": correlation_id,
                "container_name": container_name,
                "parsed_url": parsed_url,
                "blob_folder_name": blob_folder_name,
                "video_blob_name": video_blob_name,
            },
            ensure_ascii=False,
        )
    )
    try:
        content_data, content_type = download_blob(container_name, video_blob_name)

        # 1. Azure Content Understandingの結果を取得
        result_file_blob_name = (
            f"{blob_folder_name}/content_understanding-cu-result.json"
        )
        result_file_output_dir = Path(temp_dir, "content_understanding")
        client, _settings = create_content_understanding_client()
        result = get_content_understanding_result(
            client = client,
            url=content_data,
            container_name=container_name,
            result_file_blob_name=result_file_blob_name,
            result_file_output_dir=str(result_file_output_dir),
        )
        with open("./logs/content_understanding_result.json", "w", encoding="utf-8") as f:
            json.dump(
                {
                    "result": result.result.dict() if result.result else None,
                    "status": result.status,
                    "has_result": result.result is not None,
                    "has_contents": len(result.result.contents) > 0
                    if result.result
                    else False,
                },
                f,
                ensure_ascii=False,
                indent=2,
            )
        logger.info(
            json.dumps(
                {
                    "event": "content_understanding.completed",
                    "correlation_id": correlation_id,
                    "result_blob": result_file_blob_name,
                    "operation_id": result.id,
                    "status": result.status,
                    "has_result": result.result is not None,
                    "has_contents": len(result.result.contents) > 0,
                },
                ensure_ascii=False,
            )
        )

        # 2. 結果を解析
        transcripts_fields_keyframes = extract_transcripts_fields_keyframes(
            result.result.contents
        )
        with open("./logs/transcripts_fields_keyframes.json", "w", encoding="utf-8") as f:
            json.dump(
                {k: v.model_dump() for k, v in transcripts_fields_keyframes.items()},
                f,
                ensure_ascii=False,
                indent=2,
            )
        if len(transcripts_fields_keyframes) == 0:
            error_msg = (
                "動画からセグメントを抽出できませんでした。"
                "動画が短すぎるか、視覚的な変化が少ない可能性があります。"
            )
            logger.error(
                json.dumps(
                    {
                        "event": "segments.validation_failed",
                        "correlation_id": correlation_id,
                        "total_segments": 0,
                        "error": error_msg,
                    },
                    ensure_ascii=False,
                )
            )
            return {
                "error": error_msg,
                "error_type": "NO_SEGMENTS_DETECTED",
                "correlation_id": correlation_id,
            }
        logger.info(
            json.dumps(
                {
                    "event": "transcript.extract",
                    "correlation_id": correlation_id,
                    "segments": len(transcripts_fields_keyframes),
                    "segment_keys": list(transcripts_fields_keyframes.keys()),
                },
                ensure_ascii=False,
            )
        )
        get_images_from_content_understanding_result(
            temp_dir,
            container_name,
            blob_folder_name,
            client,
            result.id,
            transcripts_fields_keyframes,
        )

        # 3. コンテンツアンダースタンディングの結果から手順と画像を準備
        keyframes_folder_path = f"{blob_folder_name}/keyframes/"
        keyframes = get_keyframe_urls_from_container(
            container_name, keyframes_folder_path
        )
        # URLリストを生成（互換性のため）
        keyframe_urls = [k.url for k in keyframes]
        keyframe_names = [k.name for k in keyframes]

        manual_steps: list[ManualStep] = []

        idx = 0
        for key in transcripts_fields_keyframes:
            data = transcripts_fields_keyframes[key]
            manual_steps.append(
                ManualStep(
                    id=idx,
                    frameIdx=keyframe_names.index(data.keyframe),
                    description=data.fields,
                )
            )
            idx += 1

        logger.info(
            f"📊 Using update functions with {len(manual_steps)} manual steps"
        )

        # update関数を使用してファイル生成
        excel_url = update_excel(
            manual_steps,
            keyframe_urls,
            container_name,
            blob_folder_name,
            correlation_id,
        )
        word_url = update_docx(
            manual_steps,
            keyframe_urls,
            container_name,
            blob_folder_name,
            correlation_id,
        )
        markdown_url = update_markdown(
            manual_steps,
            keyframe_urls,
            container_name,
            blob_folder_name,
            correlation_id,
        )
    except Exception as e:
        logger.error(
            json.dumps(
                {
                    "event": "create_manual.error",
                    "correlation_id": correlation_id,
                    "error": str(e),
                },
                ensure_ascii=False,
            )
        )
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "correlation_id": correlation_id,
        }
    editing_data = {
        "keyframesUrls": keyframe_urls,
        "steps": [asdict(m) for m in manual_steps],  # stepsデータを追加
        "frameUrls": keyframe_urls,  # 互換性のため
        "totalFrames": len(keyframe_urls),
        "containerName": container_name,
        "folderPath": keyframes_folder_path,
        "blobFolderName": blob_folder_name,
    }

    result = {
        "excelFileURL": excel_url,
        "wordFileURL": word_url,
        "markdownFileURL": markdown_url,
        "correlation_id": correlation_id,
        "editingData": editing_data,
    }

    return result

@app.route(route="manual", methods=["GET"])
def get_manual(req: func.HttpRequest) -> func.HttpResponse:
    url = req.params.get("url")
    correlation_id = req.params.get("cid", str(uuid.uuid4()))
    if not url:
        logger.error(
            json.dumps(
                {
                    "event": "get_manual.error",
                    "correlation_id": correlation_id,
                    "error": "url parameter missing",
                },
                ensure_ascii=False,
            )
        )
        raise ValueError("不正な入力です")

    parsed_url = urlparse(url)
    container_name, blob_name = parsed_url.path.lstrip("/").split("/", 1)
    blob_folder_name = blob_name.split("/")[0]
    logger.info(
        json.dumps(
            {
                "event": "get_manual.input",
                "correlation_id": correlation_id,
                "container_name": container_name,
                "blob_folder_name": blob_folder_name,
                "blob_name": blob_name,
            },
            ensure_ascii=False,
        )
    )
    content_data, content_type = download_blob(container_name, blob_name)

    return func.HttpResponse(
        content_data,
        status_code=200,
        mimetype=content_type,
    )


@app.route(
    route="generate-upload-sas", methods=["POST"], auth_level=func.AuthLevel.FUNCTION
)
def generate_upload_sas(req: func.HttpRequest) -> func.HttpResponse:
    """SAS付きアップロードURLを生成"""

    req_json = req.get_json()
    filename = req_json.get("filename")

    if not filename:
        return func.HttpResponse("Bad Request: filename is required", status_code=400)

    try:
        container = os.environ["AZURE_STORAGE_CONTAINER"]
        date = datetime.now().strftime("%Y%m%d-%H%M%S")
        uuidv4 = uuid.uuid4()
        prefix = f"{date}-{uuidv4}"
        blob_name = f"{prefix}/{filename}"

        # SAS付きURLを生成（書き込み権限付き）
        upload_url = generate_write_sas_url(container, blob_name)

        # 実際のBlobURL（アクセス用）
        actual_url = upload_url.split("?")[0]

        response_data = {
            "filename": filename,
            "uploadUrl": upload_url,
            "blobUrl": actual_url,
            "success": True,
        }

        return func.HttpResponse(
            json.dumps(response_data, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )
    except Exception as e:
        logger.error(f"SAS生成失敗: {str(e)}")
        error_response = {"error": f"Internal Server Error: {str(e)}", "success": False}
        return func.HttpResponse(
            body=json.dumps(error_response, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )


@app.route(route="upload-json", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def upload_json(req: func.HttpRequest) -> func.HttpResponse:
    """JSONファイルのアップロード"""
    req_json = req.get_json()
    url = req_json.get("url")
    json_data = req_json.get("json_data")
    if not url:
        return func.HttpResponse("Bad Request: 不正な入力です", status_code=400)

    parsed_url = urlparse(url)
    container_name, video_blob_name = parsed_url.path.lstrip("/").split("/", 1)
    blob_folder_name = video_blob_name.split("/")[0]

    logger.info(f"Container name = {container_name}")
    logger.info(f"Blob folder name = {blob_folder_name}")
    logger.info(f"Video Blob name = {video_blob_name}")

    try:
        filename = f"{blob_folder_name}/durable-functions-uris.json"
        upload_url = upload_content_to_blob(
            json.dumps(json_data, ensure_ascii=False),
            container_name,
            filename,
        )
        logger.info(f"Generated SAS URL: {upload_url}")
        logger.info(f"filename: {filename}")

        response_data = {
            "filename": filename,
            "url": upload_url,
            "success": True,
        }

        return func.HttpResponse(
            json.dumps(response_data, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )
    except Exception as e:
        logger.error(f"ファイルアップロード失敗: {str(e)}")
        error_response = {"error": f"Internal Server Error: {str(e)}", "success": False}
        return func.HttpResponse(
            body=json.dumps(error_response, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )


@app.route(route="save-manual", methods=["POST"])
def save_manual(req: func.HttpRequest) -> func.HttpResponse:
    """マニュアル編集内容を保存するAPIエンドポイント"""
    try:
        logger.info("バックエンド: マニュアル保存処理開始")
        correlation_id = str(uuid.uuid4())

        # リクエストデータを取得
        request_data = req.get_json()
        if not request_data:
            return func.HttpResponse(
                json.dumps(
                    {"success": False, "message": "リクエストデータが不正です"},
                    ensure_ascii=False,
                ),
                status_code=400,
                mimetype="application/json",
            )

        try:
            validated_request = SaveManualRequest.model_validate(request_data)
        except ValidationError as e:
            error_msg = first_validation_error_message(e)
            logger.error(f"バックエンド: マニュアル保存エラー - {error_msg}")
            error_response = {
                "success": False,
                "error": "SAVE_ERROR",
                "message": f"マニュアルの保存に失敗しました: {error_msg}",
            }
            return func.HttpResponse(
                json.dumps(error_response, ensure_ascii=False),
                status_code=500,
                mimetype="application/json",
            )

        # リクエストデータを解析
        manual_id = validated_request.manualId
        steps_data: list[ManualStepInput] = validated_request.steps
        frame_urls = validated_request.frameUrls
        container_name = validated_request.containerName
        folder_path = validated_request.folderPath
        blob_folder_name = validated_request.blobFolderName
        llm_output_url = validated_request.llmOutputUrl

        logger.info(
            f"保存対象: manualId={manual_id}, steps={len(steps_data)}件, frameUrls={len(frame_urls)}件"
        )

        # ステップデータの詳細ログ
        for idx, step_data in enumerate(steps_data[:5]):  # 最初の5つをログ出力
            logger.info(
                f"  Received step {idx+1}: id={step_data.id}, frameIdx={step_data.frameIdx}, description='{step_data.description[:50]}...'"
            )
        if len(steps_data) > 5:
            logger.info(f"  ... and {len(steps_data) - 5} more received steps")

        # ステップデータを変換
        steps = []
        for step_data in steps_data:
            step = ManualStep(
                id=step_data.id,
                frameIdx=step_data.frameIdx,
                description=step_data.description,
            )
            steps.append(step)

        # 変換後のステップログ
        logger.info(f"変換後ステップデータ: {len(steps)}件")
        for idx, step in enumerate(steps[:5]):  # 最初の5つをログ出力
            logger.info(
                f"  Converted step {idx+1}: id={step.id}, frameIdx={step.frameIdx}, description='{step.description[:50]}...'"
            )
        if len(steps) > 5:
            logger.info(f"... and {len(steps) - 5} more converted steps")

        # ファイル更新処理
        updated_files = {}
        FILE_PREFIX = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")

        # JSONファイル更新
        llm_output_result_blob_name = f"{blob_folder_name}/output.json"
        if update_json(
            steps,
            frame_urls,
            container_name,
            blob_folder_name,
            llm_output_result_blob_name,
            correlation_id,
        ):
            # SAS付きURLを生成
            try:
                json_url = generate_read_sas_url(
                    container_name, llm_output_result_blob_name, expiry_hours=24
                )
                updated_files["jsonFileURL"] = json_url
            except Exception as e:
                logger.error(f"JSON SAS URL生成失敗: {str(e)}")

        # Excelファイル更新
        excel_url = update_excel(
            steps, frame_urls, container_name, blob_folder_name, correlation_id
        )
        if excel_url:
            updated_files["excelFileURL"] = excel_url

        # Wordファイル更新
        word_url = update_docx(
            steps, frame_urls, container_name, blob_folder_name, correlation_id
        )
        if word_url:
            updated_files["wordFileURL"] = word_url

        # Markdownファイル更新
        markdown_url = update_markdown(
            steps, frame_urls, container_name, blob_folder_name, correlation_id
        )
        if markdown_url:
            updated_files["markdownFileURL"] = markdown_url

        response = {
            "success": True,
            "message": "マニュアルを正常に保存しました",
            "updatedFiles": updated_files,
        }

        logger.info(
            f"バックエンド: マニュアル保存完了 - {len(updated_files)}個のファイルを更新"
        )

        return func.HttpResponse(
            json.dumps(response, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as e:
        logger.error(f"バックエンド: マニュアル保存エラー - {str(e)}")
        logger.error(f"スタックトレース: {traceback.format_exc()}")

        error_response = {
            "success": False,
            "error": "SAVE_ERROR",
            "message": f"マニュアルの保存に失敗しました: {str(e)}",
        }

        return func.HttpResponse(
            json.dumps(error_response, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )

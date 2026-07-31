import base64
import logging
import os
import subprocess
import time
import uuid
from typing import Dict  # Ensure Dict is imported for type annotations

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobClient, BlobServiceClient, ContainerClient

from modules.convert_to_pdf import convert_to_pdf, ConversionTimeoutError
from urllib.parse import urlparse

app = func.FunctionApp()

# 定数の定義
DST_CON_STR: str = os.environ.get("AZURE_BLOB_STORAGE_DST_CON_STR", "")
DST_CONTAINER: str = os.environ.get("AZURE_BLOB_STORAGE_DST_CONTAINER", "")
ALLOWED_EXTENSIONS = [".pptx", ".docx", ".xlsx"]
TEMP_DIR = "tmp"

credential = DefaultAzureCredential()


def parse_event_blob_info(myblob: func.EventGridEvent):
    """Event Gridイベントから共通情報を抽出"""
    myblob_data = myblob.get_json()
    blob_url = myblob_data["url"]
    parsed_url = urlparse(blob_url)
    container_name, src_file = parsed_url.path.lstrip("/").split("/", 1)
    account_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    src_name = os.path.basename(src_file)
    
    return account_url, container_name, src_file, src_name


def retry_delete_blob(blob_client, file_path: str, max_retries: int = 3):
    """リトライ付きBlob削除（指数バックオフ）"""
    for attempt in range(max_retries):
        try:
            blob_client.delete_blob()
            return  # 成功
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1秒、2秒、4秒
                logging.warning(f"削除失敗 (試行{attempt + 1}/{max_retries}): {file_path}, {wait_time}秒後に再試行")
                time.sleep(wait_time)
            else:
                logging.error(f"削除失敗（リトライ上限）: {file_path}")
                raise  # 最後の試行で失敗したら例外を投げる


def calculate_timeout(file_path: str, ext: str) -> int:
    """
    ファイルサイズと種類に応じて適切なタイムアウト時間を計算
    
    Args:
        file_path: ファイルパス
        ext: 拡張子
    
    Returns:
        int: タイムアウト秒数
    """
    try:
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        logging.info(f"ファイルサイズ: {file_size_mb:.2f} MB")
        
        # 基本タイムアウト（秒）
        base_timeout = 120  # 2分
        
        # ファイル種別ごとの処理時間係数
        if ext in [".xlsx", ".xls"]:
            # Excel: 複雑な計算・レイアウト処理のため時間がかかる
            size_factor = 60  # 1MBあたり60秒
            max_timeout = 1800  # 最大30分
        elif ext in [".pptx", ".ppt"]:
            # PowerPoint: 比較的軽い
            size_factor = 30  # 1MBあたり30秒
            max_timeout = 1200  # 最大20分
        elif ext in [".docx", ".doc"]:
            # Word: 中間的な処理時間
            size_factor = 40  # 1MBあたり40秒
            max_timeout = 1500  # 最大25分
        else:
            size_factor = 50
            max_timeout = 1800
        
        # タイムアウト計算: 基本時間 + (ファイルサイズ × 係数)
        calculated_timeout = int(base_timeout + (file_size_mb * size_factor))
        
        # 最小・最大値で制限
        timeout = max(300, min(calculated_timeout, max_timeout))  # 最小5分、最大は種別依存
        
        logging.info(f"タイムアウト計算: サイズ={file_size_mb:.2f}MB, 係数={size_factor}, 結果={timeout}秒")
        return timeout
        
    except Exception as e:
        logging.error(f"タイムアウト計算エラー: {e}")
        return 600  # エラー時はデフォルト10分


@app.event_grid_trigger(arg_name="myblob")
def blob_trigger(myblob: func.EventGridEvent):
    """
    既存のEvent Grid Subscription用のディスパッチャー関数
    イベントタイプに応じて適切な処理関数を呼び出す
    
    Note: Event Grid Subscription設定変更後は、pdf_conversion_handler と
          pdf_deletion_handler が直接呼び出されるため、この関数は使用されなくなる
    """
    logging.info(f"blob_trigger called with event: {myblob.get_json()}")
    event_type = myblob.event_type
    
    if event_type == "Microsoft.Storage.BlobDeleted":
        logging.info("BlobDeleted event detected, delegating to pdf_deletion_handler")
        pdf_deletion_handler(myblob)
    else:
        # BlobCreated, BlobRenamed, BlobTierChanged等、削除以外はすべて変換処理
        logging.info(f"{event_type} event detected, delegating to pdf_conversion_handler")
        pdf_conversion_handler(myblob)


@app.event_grid_trigger(arg_name="event")
def pdf_conversion_handler(event: func.EventGridEvent):
    """PDF変換処理（削除以外のイベント用：BlobCreated, BlobRenamed, BlobTierChanged等）"""
    logging.info(f"Event Grid event received: {event.get_json()}")
    
    try:
        # イベントタイプを検証
        # Note: blob_triggerから呼び出される際は、BlobRenamed等も処理する必要があるためコメントアウト
        # if event.event_type != "Microsoft.Storage.BlobCreated":
        #     logging.warning(f"想定外のイベントタイプ: {event.event_type}")
        #     return
        
        account_url, container_name, src_file, src_name = parse_event_blob_info(event)
        
        logging.info(f"コンテナ：{container_name}")
        logging.info(f"処理対象のファイル：{src_file}")
        logging.info(f"処理対象のファイル名：{src_name}")
        logging.info(f"処理対象のアカウントURL：{account_url}\n")

        if src_name == ".keep":
            logging.info(f".keep ファイルなので処理スキップ: {src_file}")
            return

        # 拡張子チェック：指定の拡張子のみ処理
        ext = os.path.splitext(src_file)[1].lower()
        # 拡張子をアンダースコアに置き換えてPDF化（例: report.docx → report_docx.pdf）
        dst_file: str = (
            src_file.replace(ext, f"_{ext[1:]}.pdf")
            if ext in ALLOWED_EXTENSIONS
            else src_file
        )
        # Blobの内容をダウンロード
        try:
            container_client: ContainerClient = create_src_container_client(account_url, container_name)
            blob_client: BlobClient = container_client.get_blob_client(blob=src_file)
            content: bytes = blob_client.download_blob().readall()
        except Exception as e:
            logging.error(f"Blobのダウンロードに失敗しました: {e}")
            return

        # 0バイトファイルの処理（削除命令として扱う）
        if len(content) == 0:
            logging.info(f"0バイトファイルを検知、削除処理を開始: {src_file}")
            try:
                blob_client.delete_blob()
                logging.info(f"0バイトファイルを削除しました: {src_file}")
            except Exception as e:
                logging.error(f"0バイトファイルの削除に失敗: {src_file}, エラー: {e}")
            return  # 変換処理はスキップ

        local_file_path = None
        pdf_path = None
        conversion_success = False

        try:
            # Blobの内容をローカルにダウンロード
            local_file_path = download_blob(content, src_file, TEMP_DIR)
            
            if ext in ALLOWED_EXTENSIONS:
                # ファイルサイズに応じたタイムアウトを計算
                timeout_seconds = calculate_timeout(local_file_path, ext)
                logging.info(f"計算されたタイムアウト: {timeout_seconds}秒")
                
                # PDFへの変換
                pdf_path = convert_to_pdf(local_file_path, output_dir=TEMP_DIR, timeout_seconds=timeout_seconds)
                logging.info(f"PDFに変換されました: {pdf_path}")
            else:
                # PDF変換をスキップ
                pdf_path = local_file_path

            # メタデータを作成
            metadata: Dict[str, str] = set_metadata(src_file, src_name)

            # 変換後のPDFをBlob Storageへアップロード
            upload_pdf(pdf_path, metadata, dst_file)
            
            # ①成功時の処理
            # コンテナ1(元データ): 保持（削除しない）
            # ローカルストレージ: finally句で削除
            conversion_success = True
            logging.info(f"PDF conversion completed successfully: {src_file}")
            logging.info(f"Source blob retained in container: {src_file}")
            
        except ConversionTimeoutError as e:
            # ②タイムアウト時の処理：切り戻し
            logging.error(f"PDF conversion timeout for {src_file}: {e}")
            rollback_on_failure(src_file, dst_file, account_url, container_name, "timeout")
            
        except Exception as e:
            # ②エラー時の処理：切り戻し
            logging.error(f"Processing failed for {src_file}: {e}", exc_info=True)
            rollback_on_failure(src_file, dst_file, account_url, container_name, "error")
            
        finally:
            # ローカルストレージからは常に削除
            temp_files = []
            if local_file_path:
                temp_files.append(local_file_path)
            if pdf_path and pdf_path != local_file_path:
                temp_files.append(pdf_path)
            cleanup_temp_files(temp_files)
            
    except Exception as e:
        logging.error(f"処理失敗: {e}", exc_info=True)
        raise


@app.event_grid_trigger(arg_name="event")
def pdf_deletion_handler(event: func.EventGridEvent):
    """PDF削除処理（削除イベント専用）"""
    logging.info(f"Event Grid event received: {event.get_json()}")
    
    try:
        # イベントタイプを検証（防御的プログラミング）
        if event.event_type != "Microsoft.Storage.BlobDeleted":
            logging.warning(f"想定外のイベントタイプ: {event.event_type}")
            return
        
        account_url, container_name, src_file, src_name = parse_event_blob_info(event)
        
        # 変換後のファイル名を計算
        ext = os.path.splitext(src_file)[1].lower()
        dst_file = src_file.replace(ext, f"_{ext[1:]}.pdf") if ext in ALLOWED_EXTENSIONS else src_file
        
        # ストレージ2（PDF）を削除（リトライ付き）
        dst_container_client = create_dst_container_client()
        dst_blob_client = dst_container_client.get_blob_client(dst_file)
        
        if dst_blob_client.exists():
            retry_delete_blob(dst_blob_client, dst_file)
            logging.info(f"PDF削除成功: {dst_file}")
        else:
            logging.info(f"{dst_file}は既に削除済みです")
        
    except Exception as e:
        logging.error(f"PDF削除失敗: {e}", exc_info=True)
        raise


def create_src_container_client(account_url: str, container_name: str) -> ContainerClient:
    src_blob_service: BlobServiceClient = BlobServiceClient(
        account_url=account_url, credential=credential
    )
    src_blob_container: ContainerClient = src_blob_service.get_container_client(
        container_name
    )
    return src_blob_container

def create_dst_container_client() -> ContainerClient:
    try:
        dst_blob_service: BlobServiceClient = BlobServiceClient(
            account_url=DST_CON_STR, credential=credential
        )
        dst_blob_container: ContainerClient = dst_blob_service.get_container_client(
            DST_CONTAINER
        )
        return dst_blob_container
    except Exception as e:
        logging.error(f"Connect failed to  dst_blob_container: {e}")
        raise Exception(f"Connect failed to  dst_blob_container: {e}")


def rollback_on_failure(src_file: str, dst_file: str, account_url: str, container_name: str, failure_type: str):
    """
    失敗時の切り戻し処理
    コンテナ1(元データ)とコンテナ2(PDF)の両方を削除
    
    Args:
        src_file: 元ファイル名
        dst_file: 変換後ファイル名
        account_url: アカウントURL
        container_name: コンテナ名
        failure_type: 失敗の種類（"timeout" or "error"）
    """
    logging.warning(f"Starting rollback due to {failure_type}: {src_file}")
    
    try:
        src_container_client: ContainerClient = create_src_container_client(account_url, container_name)
        dst_container_client: ContainerClient = create_dst_container_client()
        
        # コンテナ1(元データ)を削除
        try:
            src_blob_client: BlobClient = src_container_client.get_blob_client(src_file)
            if src_blob_client.exists():
                src_blob_client.delete_blob()
                logging.info(f"Rollback: Source blob deleted from container1: {src_file}")
            else:
                logging.info(f"Rollback: Source blob does not exist in container1: {src_file}")
        except Exception as e:
            logging.error(f"Rollback: Failed to delete source blob {src_file}: {e}")
        
        # コンテナ2(PDF)を削除（存在する場合）
        try:
            dst_blob_client: BlobClient = dst_container_client.get_blob_client(dst_file)
            if dst_blob_client.exists():
                dst_blob_client.delete_blob()
                logging.info(f"Rollback: Destination blob deleted from container2: {dst_file}")
            else:
                logging.info(f"Rollback: Destination blob does not exist in container2: {dst_file}")
        except Exception as e:
            logging.error(f"Rollback: Failed to delete destination blob {dst_file}: {e}")
        
        logging.warning(f"Rollback completed for {src_file}")
        
    except Exception as e:
        logging.error(f"Rollback: Critical error during rollback for {src_file}: {e}")


def download_blob(content: bytes, blob_name: str, output_dir: str) -> str:
    """
    Blobの内容をローカルファイルに保存する。

    Args:
        blob (func.InputStream): ダウンロード対象のBlob
        output_dir (str): 保存先ディレクトリ

    Returns:
        str: ローカルに保存されたファイルのパス
    """
    local_file_path = os.path.join(output_dir, blob_name)
    os.makedirs(os.path.dirname(local_file_path), exist_ok=True)
    try:
        with open(local_file_path, "wb") as f:
            f.write(content)
        logging.info(f"Blob successfully downloaded to: {local_file_path}")
    except Exception as e:
        logging.error(f"Failed to download blob to local file: {e}")
        raise Exception(f"Failed to download blob to local file: {e}")
    return local_file_path


def set_metadata(src_path: str, src_name: str) -> Dict[str, str]:
    storage_id: str = str(uuid.uuid4())
    rawdata_name: str = base64.b64encode(src_name.encode("utf-8")).decode("ascii")
    rawdata_path: str = base64.b64encode(src_path.encode("utf-8")).decode("ascii")

    metadata = {
        "storage_id": storage_id,
        "rawdata_name": rawdata_name,
        "rawdata_path": rawdata_path,
    }

    logging.info(f"metadata: {metadata}")

    return metadata


def upload_pdf(pdf_path: str, metadata: Dict[str, str], dst_file: str):
    """
    PDFファイルをBlob Storageの指定コンテナにアップロードする。

    Args:
        pdf_path (str): アップロード対象のPDFファイルのパス
    """
    container_client: ContainerClient = create_dst_container_client()

    if not isinstance(dst_file, str):
        logging.error(f"dst_file must be a string, but got {type(dst_file)}")
        raise Exception(f"dst_file must be a string, but got {type(dst_file)}")
    if not isinstance(pdf_path, str):
        logging.error(f"pdf_path must be a string, but got {type(pdf_path)}")
        raise Exception(f"pdf_path must be a string, but got {type(pdf_path)}")

    try:
        with open(pdf_path, "rb") as data:
            container_client.upload_blob(
                name=dst_file,
                data=data,
                overwrite=True,
                metadata=metadata,
            )
        logging.info(
            f"{dst_file}がBlob Storageのpdf用コンテナにアップロードされました。"
        )
    except FileNotFoundError:
        logging.error(f"ファイル '{pdf_path}' が見つかりません。")
        raise Exception(f"ファイル '{pdf_path}' が見つかりません。")

    except Exception as e:
        logging.error(f"Failed to upload blob: {e}")
        raise Exception(f"Failed to upload blob: {e}")


def cleanup_temp_files(file_paths):
    """
    指定されたファイルを削除し、ログに結果を出力する。

    Args:
        file_paths (list): 削除対象のファイルパスのリスト
    """
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logging.info(f"Temporary file removed: {file_path}")
        except Exception as e:
            logging.error(f"Temporary file deletion failed for {file_path}: {e}")
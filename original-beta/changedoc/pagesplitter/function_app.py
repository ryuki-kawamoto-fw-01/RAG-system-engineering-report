import base64
import io
import logging
import os
import time
import uuid
from typing import Dict
from urllib.parse import urlparse

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobClient, BlobServiceClient, ContainerClient
from pypdf import PdfReader, PdfWriter

app = func.FunctionApp()

# Constants and configurations
DST_CON_STR: str = os.environ.get("AZURE_BLOB_STORAGE_DST_CON_STR", "")
DST_CONTAINER: str = os.environ.get("AZURE_BLOB_STORAGE_DST_CONTAINER", "")

credential = DefaultAzureCredential()


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


def create_container_client(account_url: str, container_name: str) -> ContainerClient:
    src_blob_service: BlobServiceClient = BlobServiceClient(
        account_url=account_url, credential=credential
    )
    src_blob_container: ContainerClient = src_blob_service.get_container_client(
        container_name
    )
    return src_blob_container


def create_dst_container_client() -> ContainerClient:
    dst_blob_service: BlobServiceClient = BlobServiceClient(
        account_url=DST_CON_STR, credential=credential
    )
    dst_blob_container: ContainerClient = dst_blob_service.get_container_client(
        DST_CONTAINER
    )
    return dst_blob_container


def set_metadata(src_path: str, src_blob_container: ContainerClient) -> Dict[str, str]:
    # metadataを取得
    blob = src_blob_container.get_blob_client(src_path)
    blob_properties = blob.get_blob_properties()
    metadata = blob_properties.metadata

    # 追加したいキーと値を設定
    metadata["pdfdata_path"] = base64.b64encode(src_path.encode("utf-8")).decode(
        "ascii"
    )

    file_name = os.path.basename(src_path)
    file_path = src_path
    metadata["storage_blob_name"] = base64.b64encode(file_name.encode("utf-8")).decode(
        "ascii"
    )
    metadata["storage_file_path_name"] = base64.b64encode(
        file_path.encode("utf-8")
    ).decode("ascii")

    return metadata


def dst_split_filepath(src_path: str, page_num: int) -> str:
    # アンダースコア区切りのファイル名に対応（例: report_docx.pdf → report_docx.pdf/report_docx-0.pdf）
    file_name = os.path.basename(src_path)
    # 拡張子を取得（最後の.以降）
    ext_idx = file_name.rfind('.')
    if ext_idx > 0:
        base_name = file_name[:ext_idx]
        ext = file_name[ext_idx:]
    else:
        base_name = file_name
        ext = ''
    dst_dirpath: str = src_path
    dst_file_name: str = base_name + f"-{page_num}{ext}"
    dst_file_path: str = f"{dst_dirpath}/{dst_file_name}"
    return dst_file_path


def clear_exists_split_file(src_path: str, dst_blob_container: ContainerClient) -> None:
    """既存の分割PDFファイルを削除"""
    i: int = 0
    deleted_count = 0
    
    while True:
        output_file_path_pdf: str = dst_split_filepath(src_path, i)
        blob_client: BlobClient = dst_blob_container.get_blob_client(
            output_file_path_pdf
        )
        if blob_client.exists():
            try:
                retry_delete_blob(blob_client, output_file_path_pdf)
                deleted_count += 1
                logging.info(f"既存分割ファイル削除: {output_file_path_pdf}")
            except Exception as e:
                logging.error(f"既存分割ファイル削除失敗: {output_file_path_pdf}, エラー: {e}")
                raise
        else:
            break  # これ以上ファイルがない
        i += 1
    
    if deleted_count > 0:
        logging.info(f"既存分割ファイル削除完了: {deleted_count}ファイル")


def create_split_pdf(
    src_path: str, dst_blob_container: ContainerClient, content: bytes, metadata: dict
) -> None:
    read_data_pdf: io.BytesIO = io.BytesIO(content)
    reader: PdfReader = PdfReader(read_data_pdf)
    pages = reader.pages
    pagecount: int = len(pages)
    logging.info(f"処理対象のPDFファイルのページ数: {pagecount}\n")

    for i in range(pagecount):
        output_file_path_pdf: str = dst_split_filepath(src_path, i)
        # ページ分割後にstorage_idを付与し、ファイルを一意に識別できるよう設定
        metadata["storage_id"] = str(uuid.uuid4())
        with io.BytesIO() as f:
            writer: PdfWriter = PdfWriter()
            writer.add_page(pages[i])
            writer.write(f)
            f.seek(0)
            blob_client: BlobClient = dst_blob_container.get_blob_client(
                output_file_path_pdf
            )
            blob_client.upload_blob(f, overwrite=True, metadata=metadata)
            logging.info(f"正常終了:<処理対象：{i+1}ページ>/{src_path}\n")


def split_file(
    src_path: str,
    dst_blob_container: ContainerClient,
    content: bytes,
    metadata: Dict[str, str],
):
    fname, ext = os.path.splitext(os.path.basename(src_path))
    if ext == ".pdf":
        create_split_pdf(src_path, dst_blob_container, content, metadata)
    else:
        raise NotImplementedError("ファイル分割処理対象外のファイルです")


def dst_filepath_other(src: str) -> str:
    # アンダースコア区切りのパス構造に対応
    output_folder_other: str = src
    output_file_name_other: str = os.path.basename(src)
    output_file_path_other: str = f"{output_folder_other}/{output_file_name_other}"
    return output_file_path_other


def clear_exists_other_file(src_path: str, dst_blob_container: ContainerClient) -> None:
    """既存の非PDFファイルを削除"""
    dst_path: str = dst_filepath_other(src_path)
    blob_client: BlobClient = dst_blob_container.get_blob_client(dst_path)
    if blob_client.exists():
        try:
            retry_delete_blob(blob_client, dst_path)
            logging.info(f"既存ファイル削除: {dst_path}")
        except Exception as e:
            logging.error(f"既存ファイル削除失敗: {dst_path}, エラー: {e}")
            raise


def create_file(
    src_path: str,
    dst_blob_container: ContainerClient,
    content: bytes,
    metadata: Dict[str, str],
) -> None:
    read_data_other: io.BytesIO = io.BytesIO(content)
    read_data_other.seek(0)
    dst_path: str = dst_filepath_other(src_path)
    blob_client: BlobClient = dst_blob_container.get_blob_client(dst_path)
    blob_client.upload_blob(read_data_other, overwrite=True, metadata=metadata)


def delete_all_split_pages(src_path: str):
    """分割されたPDFページを全て削除"""
    dst_container_client = create_dst_container_client()
    deleted_count = 0
    
    try:
        i = 0
        while True:
            split_file_path = dst_split_filepath(src_path, i)
            blob_client = dst_container_client.get_blob_client(split_file_path)
            
            if blob_client.exists():
                retry_delete_blob(blob_client, split_file_path)  # ← リトライ付き削除
                deleted_count += 1
                logging.info(f"分割ページ削除: {split_file_path}")
            else:
                break  # これ以上ファイルがない
            i += 1
        
        logging.info(f"分割PDF削除完了: {deleted_count}ファイル")
        
    except Exception as e:
        logging.error(f"分割PDF削除失敗 (削除済み: {deleted_count}件): {e}")
        raise


def delete_other_file(src_path: str):
    """非PDFファイルを削除"""
    dst_container_client = create_dst_container_client()
    
    try:
        dst_path = dst_filepath_other(src_path)
        blob_client = dst_container_client.get_blob_client(dst_path)
        
        if blob_client.exists():
            retry_delete_blob(blob_client, dst_path)
            logging.info(f"非PDFファイル削除完了: {dst_path}")
        else:
            logging.info(f"非PDFファイルは既に削除済み: {dst_path}")
            
    except Exception as e:
        logging.error(f"非PDFファイル削除失敗: {src_path}, エラー: {e}")
        raise


@app.event_grid_trigger(arg_name="inp")
def page_splitter(inp: func.EventGridEvent) -> None:
    logging.info(f"Event Grid event received: {inp.get_json()}")
    
    try:
        # Event GridイベントからBlobのURLを取得
        inp_data = inp.get_json()
        event_type = inp.event_type  # ← イベントタイプ取得
        blob_url = inp_data["url"]
        logging.info(f"Blob URL: {blob_url}")
        
        parsed_url = urlparse(blob_url)
        container_name, src_path = parsed_url.path.lstrip("/").split("/", 1)
        account_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        target_name: str = os.path.basename(src_path)
        
        # 削除イベント処理
        if event_type == "Microsoft.Storage.BlobDeleted":
            logging.info(f"削除イベント検知: {src_path}")
            
            # ファイル拡張子を判定
            file_ext = os.path.splitext(target_name)[1].lower()
            
            if file_ext == ".pdf":
                # PDFファイルの場合：分割ページを削除
                delete_all_split_pages(src_path)
            else:
                # 非PDFファイルの場合：その他のファイルを削除
                delete_other_file(src_path)
            
            return
        
        # 作成・更新イベント処理
        if event_type == "Microsoft.Storage.BlobCreated":
            logging.info(f"処理対象のファイル：{src_path}\n")
            logging.info(f"処理対象のアカウントURL：{account_url}\n")
            logging.info(f"処理対象のファイル名：{target_name}\n")

            # Blob クライアントと出力コンテナーの初期化
            dst_blob_container: ContainerClient = create_dst_container_client()
            src_blob_container: ContainerClient = create_container_client(
                account_url, container_name
            )
            # Blobの内容をダウンロード
            target_blob_client: BlobClient = src_blob_container.get_blob_client(
                blob=src_path
            )
            content: bytes = target_blob_client.download_blob().readall()

            if os.path.splitext(target_name)[1].lower() in [".pdf"]:
                # すでにPDFファイルが存在する場合は削除
                clear_exists_split_file(src_path, dst_blob_container)
                if content:
                    metadata = set_metadata(src_path, src_blob_container)
                    split_file(src_path, dst_blob_container, content, metadata)
            else:
                # すでにファイルが存在する場合は削除
                clear_exists_other_file(src_path, dst_blob_container)
                if content:
                    metadata = set_metadata(src_path, src_blob_container)
                    create_file(src_path, dst_blob_container, content, metadata)
            logging.info(f"出力処理終了：{src_path}\n")
            
    except Exception as e:
        logging.error(f"処理失敗: {e}", exc_info=True)
        raise
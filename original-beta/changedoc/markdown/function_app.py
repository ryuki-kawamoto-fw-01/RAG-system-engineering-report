import base64
import logging
import os
import time
from typing import Dict
from urllib.parse import urlparse

import azure.functions as func
from azure.storage.blob import ContainerClient

from modules.blob_file import (
    create_dst_container_client,
    create_src_container_client,
    get_dst_file_path,
)
from modules.document_intelligence import DocumentIntelligenceSample

app = func.FunctionApp()


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


def set_metadata(src_path: str, src_container_client) -> Dict[str, str]:
    # metadataを取得
    blob = src_container_client.get_blob_client(src_path)
    blob_properties = blob.get_blob_properties()
    metadata = blob_properties.metadata

    # 追加したいキーと値を設定
    metadata["pagedata_path"] = base64.b64encode(src_path.encode("utf-8")).decode(
        "ascii"
    )

    return metadata


def handle_blob_deleted(src_path: str):
    """削除イベント処理 - 最終削除"""
    dst_path = None
    try:
        dst_path = get_dst_file_path(src_path)
        dst_container_client = create_dst_container_client()
        dst_blob_client = dst_container_client.get_blob_client(dst_path)
        
        if dst_blob_client.exists():
            retry_delete_blob(dst_blob_client, dst_path)  # ← リトライ付き削除
            logging.info(f"{dst_path}を削除しました")
        else:
            logging.info(f"{dst_path}は既に削除済みです")
            
    except Exception as e:
        logging.error(f"Markdown削除失敗: {src_path} -> {dst_path}, エラー: {e}")
        raise


@app.event_grid_trigger(arg_name="myblob")
def markdown(myblob: func.EventGridEvent):
    logging.info(f"Event Grid event received: {myblob.get_json()}")
    
    try:
        # Event GridイベントからBlobのURLを取得
        myblob_data = myblob.get_json()
        event_type = myblob.event_type  # ← イベントタイプ取得
        blob_url = myblob_data["url"]
        logging.info(f"Blob URL: {blob_url}")
        
        parsed_url = urlparse(blob_url)
        container_name, src_path = parsed_url.path.lstrip("/").split("/", 1)
        account_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        target_name: str = os.path.basename(src_path)
        
        # 削除イベント処理
        if event_type == "Microsoft.Storage.BlobDeleted":
            logging.info(f"削除イベント検知: {src_path}")
            handle_blob_deleted(src_path)
            return
        
        # 作成・更新イベント処理
        if event_type == "Microsoft.Storage.BlobCreated":
            logging.info(f"処理対象のファイル：{src_path}\n")
            logging.info(f"処理対象のファイル名：{target_name}\n")
            # クラスの読み込み
            client = DocumentIntelligenceSample()

            # Blob クライアントと出力コンテナーの初期化
            dst_blob_container: ContainerClient = create_dst_container_client()
            src_blob_container: ContainerClient = create_src_container_client(account_url, container_name)

            # Blob の内容をダウンロード
            downloaded_blob = src_blob_container.get_blob_client(src_path).download_blob()

            # ファイル拡張子を取得
            file_extension = os.path.splitext(target_name)[1].lower()

            # 処理対象ファイルの拡張子に応じて処理
            if file_extension == ".pdf":
                try:
                    logging.info(f"ドキュメントの処理を開始します: {target_name}")

                    # 出力ファイル名
                    dst_path: str = get_dst_file_path(src_path)
                    logging.info(f"出力ファイルパス: {dst_path}")

                    # ドキュメントの解析
                    output_text = client.exec(downloaded_blob)
                    if output_text == "エラー":
                        logging.error(
                            f"ドキュメントの解析中にエラーが発生しました: {target_name}"
                        )
                        return
                    logging.info("ドキュメントの解析が完了しました")

                    metadata = set_metadata(src_path, src_blob_container)
                    # コンテナーへのアップロード
                    dst_blob_container.upload_blob(
                        name=dst_path,
                        data=output_text,
                        overwrite=True,
                        metadata=metadata,
                    )
                    logging.info(f"ファイルをアップロードしました: {dst_path}")
                except Exception as e:
                    logging.error(f"異常発生:/{dst_path}")
                    logging.error(e, exc_info=True)
                else:
                    logging.info(f"正常終了:/{dst_path}")
            else:  # 上記以外のファイルの場合
                try:
                    logging.info(f"その他のファイルの処理を開始します: {target_name}")

                    # 元のファイルをそのまま出力コンテナーにアップロード
                    blob_client_out = dst_blob_container.get_blob_client(src_path)
                    metadata = set_metadata(src_path, src_blob_container)
                    blob_client_out.upload_blob(
                        downloaded_blob.readall(), overwrite=True, metadata=metadata
                    )
                    logging.info(f"ファイルをアップロードしました: {src_path}")
                except Exception as e:
                    logging.error(f"異常発生: /{src_path}")
                    logging.error(e, exc_info=True)
                else:
                    logging.info(f"正常終了: /{src_path}")
                    
    except Exception as e:
        logging.error(f"処理失敗: {e}", exc_info=True)
        raise
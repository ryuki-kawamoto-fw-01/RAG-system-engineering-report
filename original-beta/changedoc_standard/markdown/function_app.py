import base64
import logging
import os
from typing import Dict

import azure.functions as func
from azure.storage.blob import ContainerClient

from modules.blob_file import (
    SrcContainer,
    create_dst_container_client,
    create_src_container_client,
    get_dst_file_path,
)
from modules.openai_converter import OpenAIDocumentConverter

app = func.FunctionApp()


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


@app.blob_trigger(arg_name="myblob", path=SrcContainer, connection="")
def markdown(myblob: func.InputStream):
    target_name = ""
    try:
        # クラスの読み込み
        client = OpenAIDocumentConverter()

        # 処理対象のファイル名(パス含む)取得
        target_file: str = myblob.name or ""
        target_name: str = os.path.basename(target_file)
        # Blob クライアントと出力コンテナーの初期化
        dst_blob_container: ContainerClient = create_dst_container_client()
        src_blob_container: ContainerClient = create_src_container_client()
        src_path: str = target_file.split("/", 1)[1]

        # Blob の内容をダウンロード
        downloaded_blob = src_blob_container.get_blob_client(src_path).download_blob()

        # ファイル拡張子を取得
        file_extension = os.path.splitext(target_name)[1].lower()

        # 処理対象ファイルの拡張子に応じて処理
        if file_extension == ".pdf":
            dst_path = ""
            try:
                logging.info(f"ドキュメントの処理を開始します: {target_name}")

                # 出力ファイル名
                dst_path = get_dst_file_path(src_path)
                logging.info(f"出力ファイルパス: {dst_path}")

                if not downloaded_blob:
                    # pagesplitterのBlobは不要なので削除
                    src_blob_container.get_blob_client(src_path).delete_blob()
                    # markdownのBlobも物理削除
                    dst_blob_client = dst_blob_container.get_blob_client(dst_path)
                    if dst_blob_client.exists():
                        dst_blob_client.delete_blob()
                        logging.info(f"{dst_path}を削除しました")
                    return

                # ドキュメントの解析
                output_text = client.process_document(
                    downloaded_blob.readall(), file_extension
                )
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
            logging.error("処理対象外のファイルです")
            # try:
            #     logging.info(f"その他のファイルの処理を開始します: {target_name}")

            #     if not downloaded_blob:
            #         src_blob_container.get_blob_client(src_path).delete_blob()
            #         dst_blob_container.get_blob_client(src_path).delete_blob()
            #         logging.info(f"{src_path}を削除しました")
            #         return

            #     # 元のファイルをそのまま出力コンテナーにアップロード
            #     blob_client_out = dst_blob_container.get_blob_client(src_path)
            #     metadata = set_metadata(src_path, src_blob_container)

            #     blob_client_out.upload_blob(
            #         downloaded_blob.readall(), overwrite=True, metadata=metadata
            #     )
            #     logging.info(f"ファイルをアップロードしました: {src_path}")
            # except Exception as e:
            #     logging.error(f"異常発生: /{src_path}")
            #     logging.error(e, exc_info=True)
            # else:
            #     logging.info(f"正常終了: /{src_path}")
    except Exception as e:
        logging.error("アップロード処理失敗")
        logging.error(e, exc_info=True)
    logging.info(f"アップロード処理終了：{target_name}")

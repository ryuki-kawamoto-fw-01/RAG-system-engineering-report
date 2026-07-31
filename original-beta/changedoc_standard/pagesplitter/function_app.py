import base64
import io
import logging
import os
import uuid
from typing import Dict, Optional

import azure.functions as func
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobClient, BlobServiceClient, ContainerClient
from pypdf import PdfReader, PdfWriter

app = func.FunctionApp()

# Constants and configurations
SRC_CON_STR: str = os.environ.get("AZURE_BLOB_STORAGE_SRC_CON_STR", "")
SRC_CONTAINER: str = os.environ.get("AZURE_BLOB_STORAGE_SRC_CONTAINER", "")
DST_CON_STR: str = os.environ.get("AZURE_BLOB_STORAGE_DST_CON_STR", "")
DST_CONTAINER: str = os.environ.get("AZURE_BLOB_STORAGE_DST_CONTAINER", "")

credential = DefaultAzureCredential()


def create_src_container_client() -> ContainerClient:
    src_blob_service: BlobServiceClient = BlobServiceClient(
        account_url=SRC_CON_STR, credential=credential
    )
    src_blob_container: ContainerClient = src_blob_service.get_container_client(
        SRC_CONTAINER
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


def set_metadata(
    src_path: str,
    src_blob_container: ContainerClient,
    dst_blob_container: ContainerClient,
    output_file_path: Optional[str] = None,
) -> Dict[str, str]:
    # 元ファイルのメタデータを取得
    blob = src_blob_container.get_blob_client(src_path)
    try:
        blob_properties = blob.get_blob_properties()
        metadata = blob_properties.metadata.copy() if blob_properties.metadata else {}
    except Exception:
        # ファイルが存在しない場合は空のメタデータから開始
        metadata = {}

    # 出力ファイルパスが指定されていない場合は元のパスを使用
    target_path = output_file_path if output_file_path else src_path
    file_name = os.path.basename(target_path)

    # 必須メタデータを設定/更新
    metadata["pdfdata_path"] = base64.b64encode(src_path.encode("utf-8")).decode(
        "ascii"
    )
    metadata["storage_blob_name"] = base64.b64encode(file_name.encode("utf-8")).decode(
        "ascii"
    )
    metadata["storage_file_path_name"] = base64.b64encode(
        target_path.encode("utf-8")
    ).decode("ascii")

    # descriptionがない(=新規作成)の場合、storage_idを採番する
    if "description" not in metadata:
        metadata["storage_id"] = str(uuid.uuid4())
        logging.info("storage_idを新規作番")
        logging.info(target_path)
    else:
        dst_blob = dst_blob_container.get_blob_client(target_path)
        # pagesplitterに旧ファイルが存在する場合、storage_idを引き継ぎ
        if dst_blob.exists():
            try:
                dst_properties = dst_blob.get_blob_properties()
                dst_meta = dst_properties.metadata.copy() if dst_properties.metadata else {}
                metadata["storage_id"] = dst_meta["storage_id"]
            except Exception as e:
                logging.error("storage_idの引継ぎ失敗")
                logging.error(e)
        else:
            # pagesplitterに旧ファイルが存在しない場合、storage_idを採番する
            metadata["storage_id"] = str(uuid.uuid4())
     
    return metadata


def dst_split_filepath(src_path: str, page_num: int) -> str:
    file_name, ext = os.path.splitext(os.path.basename(src_path))
    dst_dirpath: str = os.path.splitext(src_path)[0]
    dst_file_name: str = file_name + f"-{page_num}{ext}"
    dst_file_path: str = f"{dst_dirpath}/{dst_file_name}"
    return dst_file_path


def clear_exists_split_file(src_path: str, dst_blob_container: ContainerClient) -> None:
    i: int = 0
    while True:
        output_file_path_pdf: str = dst_split_filepath(src_path, i)
        blob_client: BlobClient = dst_blob_container.get_blob_client(
            output_file_path_pdf
        )
        try:
            dst_properties = blob_client.get_blob_properties()
            dst_meta = dst_properties.metadata.copy() if dst_properties.metadata else {}
        except Exception as e:
            dst_meta = {}

        if blob_client.exists():
            # Azure Functionの削除トリガー起動のため空文字を書き込む
            blob_client.upload_blob("", overwrite=True, metadata=dst_meta)
            # 削除はここでは行わない、呼び出し先でファイル参照する必要があるため
        else:
            return
        i += 1


def create_split_pdf(
    src_path: str,
    src_blob_container: ContainerClient,
    dst_blob_container: ContainerClient,
    content: bytes,
) -> None:
    read_data_pdf: io.BytesIO = io.BytesIO(content)
    reader: PdfReader = PdfReader(read_data_pdf)
    pages = reader.pages
    pagecount: int = len(pages)
    logging.info(f"処理対象のPDFファイルのページ数: {pagecount}\n")

    for i in range(pagecount):
        output_file_path_pdf: str = dst_split_filepath(src_path, i)
        with io.BytesIO() as f:
            writer: PdfWriter = PdfWriter()
            writer.add_page(pages[i])
            writer.write(f)
            f.seek(0)
            blob_client: BlobClient = dst_blob_container.get_blob_client(
                output_file_path_pdf
            )
            metadata: Dict[str, str] = set_metadata(
                src_path, src_blob_container, dst_blob_container, output_file_path_pdf
            )
            blob_client.upload_blob(f, overwrite=True, metadata=metadata)
            logging.info(f"正常終了:<処理対象：{i+1}ページ>/{src_path}\n")


def split_file(
    src_path: str,
    src_blob_container: ContainerClient,
    dst_blob_container: ContainerClient,
    content: bytes,
):
    fname, ext = os.path.splitext(os.path.basename(src_path))
    if ext == ".pdf":
        create_split_pdf(src_path, src_blob_container, dst_blob_container, content)
    else:
        raise NotImplementedError("ファイル分割処理対象外のファイルです")


# def dst_filepath_other(src: str) -> str:
#     output_folder_other: str = os.path.splitext(src)[0]
#     output_file_name_other: str = os.path.basename(src)
#     output_file_path_other: str = f"{output_folder_other}/{output_file_name_other}"
#     return output_file_path_other


# def clear_exists_other_file(src_path: str, dst_blob_container: ContainerClient) -> None:
#     dst_path: str = dst_filepath_other(src_path)
#     blob_client: BlobClient = dst_blob_container.get_blob_client(dst_path)
#     if blob_client.exists():
#         # Azure Functionの削除トリガー起動のため空文字を書き込む
#         blob_client.upload_blob("", overwrite=True)
#         # 削除はここでは行わない、呼び出し先でファイル参照する必要があるため


# def create_file(
#     src_path: str,
#     src_blob_container: ContainerClient,
#     dst_blob_container: ContainerClient,
#     content: bytes,
# ) -> None:
#     read_data_other: io.BytesIO = io.BytesIO(content)
#     read_data_other.seek(0)
#     dst_path: str = dst_filepath_other(src_path)
#     # 元ファイルのdescriptionを取得
#     blob_client: BlobClient = dst_blob_container.get_blob_client(dst_path)
#     metadata: Dict[str, str] = set_metadata(src_path, src_blob_container, dst_path)
#     blob_client.upload_blob(read_data_other, overwrite=True, metadata=metadata)


@app.blob_trigger(arg_name="inp", path=SRC_CONTAINER, connection="")
def page_splitter(inp: func.InputStream) -> None:
    try:
        target_file: str = inp.name or ""
        target_name: str = os.path.basename(target_file)
        logging.info(f"処理対象のファイル：{target_file}\n")

        # Blob クライアントと出力コンテナーの初期化
        dst_blob_container: ContainerClient = create_dst_container_client()
        src_blob_container: ContainerClient = create_src_container_client()
        src_path: str = target_file.split("/", 1)[1]
        content: bytes = inp.read()

        if target_name == ".keep":
            logging.info(f".keep ファイルなので処理スキップ: {target_name}")
            return

        if os.path.splitext(target_name)[1].lower() in [".pdf"]:
            # すでにPDFファイルが存在する場合は削除
            clear_exists_split_file(src_path, dst_blob_container)
            if content:
                split_file(src_path, src_blob_container, dst_blob_container, content)
            else:
                # 空ファイルを削除
                src_blob_container.get_blob_client(src_path).delete_blob()
        # else:
        #     # すでにファイルが存在する場合は削除
        #     clear_exists_other_file(src_path, dst_blob_container)
        #     if content:
        #         create_file(src_path, src_blob_container, dst_blob_container, content)
        #     else:
        #         # 空ファイルを削除
        #         src_blob_container.get_blob_client(src_path).delete_blob()
        logging.info(f"出力処理終了：{target_file}\n")
    except Exception as e:
        logging.error("出力処理失敗\n")
        logging.error(e)

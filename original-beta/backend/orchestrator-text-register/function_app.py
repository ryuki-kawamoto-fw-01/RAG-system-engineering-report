import base64
import io
import json
import logging
import os
import traceback
import zipfile
from typing import Callable, Dict, List, Union

import azure.functions as func
from azure.storage.blob import (
    BlobClient,
    BlobProperties,
    ContainerClient,
    ContentSettings,
)
from typing_extensions import Optional

from modules.const import FOLDER_KEEP_FILE, HIDDEN_META_FILES, OFFICE_FILE_EXTENSION
from modules.create_error_handler import azure_function_create_error_handler
from modules.create_structer import file_list_to_tree
from modules.delete_error_handler import azure_function_delete_error_handler
from modules.download_error_handler import azure_function_download_error_handler
from modules.fileparser import FileParser
from modules.get_error_handler import azure_function_get_error_handler
from modules.rename_error_handler import azure_function_rename_error_handler
from modules.storage import create_container_client, generate_sas_url
from modules.type import Folder
from modules.util import get_unique_file_name

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)
ALLOWED_EXTENSIONS = [".pptx", ".docx", ".xlsx"]


def strtobool(val: str) -> bool:
    val = val.lower()
    if val in ("y", "yes", "t", "true", "on", "1"):
        return True
    elif val in ("n", "no", "f", "false", "off", "0"):
        return False
    else:
        raise ValueError(f"invalid truth value {val!r}")


def success_response(response_data: Union[Dict, List, str]) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


def error_response(message: str, status_code: int = 500) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({"success": False, "message": message}, ensure_ascii=False),
        status_code=status_code,
        mimetype="application/json",
    )


# エラーハンドリング用デコレータ
# エラーが発生した場合にログを出力し、エラーレスポンスを返す
def error_handler(
    function: Callable[[func.HttpRequest], func.HttpResponse],
) -> Callable[[func.HttpRequest], func.HttpResponse]:
    def wrapper(req: func.HttpRequest) -> func.HttpResponse:
        try:
            return function(req)
        except Exception as ex:
            logging.error(req)
            logging.error(f"エラー詳細：{traceback.format_exc()}")
            return error_response(str(ex), 500)

    wrapper.__name__ = function.__name__
    return wrapper


# Azure関数を作成する場合は@error_handlerを付与してください。


@app.route(route="get-files", methods=["POST"])
@azure_function_get_error_handler
def get_files(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    prefix = req_json.get("prefix", "")
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    container_client: ContainerClient = create_container_client(container_name)
    # ファイル一覧をリスト化
    file_list: List[BlobProperties] = [b for b in container_client.list_blobs(prefix)]
    # ファイル一覧をフォルダ構造に変換
    file_tree = file_list_to_tree(file_list)
    result = []
    for r in file_tree:
        if r.items is not None:  # ファイルの場合はNone。空フォルダの場合は[]。
            result.append(Folder(**r.model_dump()).model_dump())
        else:
            logging.info(f"ルートにフォルダーではないファイルがあるのでスキップします。：{r.id}")
    return success_response(result)


@app.route(route="download-folder", methods=["POST"])
@azure_function_download_error_handler
def download_folder(req: func.HttpRequest) -> func.HttpResponse:
    """
    指定されたprefixのファイルをすべてダウンロードしてzipで送信します。
    ZIPファイルはBase64エンコードされ、JSON形式で返されます。

    引数:
    - prefix (str): ダウンロード対象のフォルダパス。必須フィールド。
    """
    req_json = req.get_json()
    prefix = req_json.get("prefix", None)
    if prefix is None:
        return error_response("prefixは必須です", 400)
    if os.path.basename(prefix) in HIDDEN_META_FILES:
        return error_response("フォルダ名が不正です", 403)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    container_client: ContainerClient = create_container_client(container_name)
    file_list: List[str] = [
        blob.name
        for blob in container_client.list_blobs(name_starts_with=prefix)
        if not os.path.basename(blob.name) in HIDDEN_META_FILES
    ]

    if not file_list:
        return error_response("指定されたフォルダにはファイルが存在しません", 404)

    # ZIPファイルをメモリ上に作成
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_name in file_list:
            blob_client: BlobClient = container_client.get_blob_client(blob=file_name)
            file_data = blob_client.download_blob().readall()
            # ファイル名をZIP内でprefixを除いた相対パスにする
            zip_file.writestr(file_name[len(prefix) :].lstrip("/"), file_data)

    zip_buffer.seek(0)

    # ZIPファイルをBase64エンコード
    zip_base64 = base64.b64encode(zip_buffer.read()).decode("utf-8")

    # JSON形式でレスポンスを返却
    response_body = {
        "success": True,
        "data": zip_base64,
    }

    return func.HttpResponse(
        json.dumps(response_body, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@app.route(route="get-file", methods=["POST"])
@azure_function_get_error_handler
def get_file(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    filepath = req_json.get("filepath")
    if not filepath:
        return error_response("filepathは必須です", 400)
    if os.path.basename(filepath) in HIDDEN_META_FILES:
        logging.error(f"メタファイルへアクセスがありました {filepath}")
        return error_response("指定したファイルは存在しません", 404)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    container_client: ContainerClient = create_container_client(container_name)
    blob_client: BlobClient = container_client.get_blob_client(blob=filepath)
    if not blob_client.exists():
        logging.error(f"Blob not found: {filepath}")
        return error_response("指定されたファイルは存在しません", 404)

    title = blob_client.blob_name.split("/")[-1]

    content_stream = blob_client.download_blob()
    content_data = content_stream.readall()

    chardet_confidence = 0.7
    file_parser: FileParser = FileParser(chardet_confidence, logging)

    content_to_send, media_type = file_parser.file_to_content(filepath, content_data)

    if content_to_send is None:
        return error_response("ファイルのパースに失敗しました", 500)
    if media_type is None:
        return error_response("サポートされてないMediaTypeです", 415)
    return success_response(
        {
            "success": True,
            "content": content_to_send,
            "title": title,
            "media_type": media_type,
        }
    )


@app.route(route="get-file-content", methods=["GET"])
@azure_function_get_error_handler
def get_file_content(req: func.HttpRequest) -> func.HttpResponse:
    filepath = req.params.get("filepath")
    if not filepath:
        return error_response("filepathは必須です", 400)
    if os.path.basename(filepath) in HIDDEN_META_FILES:
        logging.warning(f"メタファイルへのアクセス試行: {filepath}")
        return error_response("指定したファイルは存在しません", 404)
    container_name = req.params.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    container_client: ContainerClient = create_container_client(container_name)
    blob_client: BlobClient = container_client.get_blob_client(blob=filepath)

    if not blob_client.exists():
        logging.error(f"Blob not found: {filepath}")
        return error_response("指定されたファイルは存在しません", 404)

    try:
        download_stream = blob_client.download_blob()
        content_data = download_stream.readall()
    except Exception as e:
        logging.error(f"Blob download failed for {filepath}: {e}")
        return error_response("ファイルのダウンロードに失敗しました", 500)

    properties = blob_client.get_blob_properties()
    content_type = (
        properties.content_settings.content_type
        if properties.content_settings and properties.content_settings.content_type
        else "application/octet-stream"
    )
    return func.HttpResponse(
        content_data,
        status_code=200,
        mimetype=content_type,
    )


@app.route(route="get-preview-file-content", methods=["GET"])
@azure_function_get_error_handler
def get_preview_file_content(req: func.HttpRequest) -> func.HttpResponse:
    filepath = req.params.get("filepath")
    if not filepath:
        return error_response("filepathは必須です", 400)
    if os.path.basename(filepath) in HIDDEN_META_FILES:
        logging.warning(f"メタファイルへのアクセス試行: {filepath}")
        return error_response("指定したファイルは存在しません", 404)
    container_name = req.params.get("container_name")
    if not container_name:
        is_split_file = bool(strtobool(req.params.get("is_split_file", "false").lower()))
        if is_split_file:
            container_name = os.environ["AZURE_STORAGE_SPLIT_FILE_CONTAINER"]
        else:
            container_name = os.environ["AZURE_PREVIEW_STORAGE_CONTAINER"]
    container_client: ContainerClient = create_container_client(container_name)
    ext = os.path.splitext(filepath)[1].lower()
    # Officeファイルは拡張子をアンダースコア付きでPDF化 (例: file.docx → file_docx.pdf)
    preview_file = filepath.replace(ext, f"_{ext[1:]}.pdf") if ext in OFFICE_FILE_EXTENSION else filepath
    blob_client: BlobClient = container_client.get_blob_client(blob=preview_file)
    if not blob_client.exists() and ext in OFFICE_FILE_EXTENSION:
        # 古い登録形式の可能性があるので、元のファイルパスで再実行
        preview_file = os.path.splitext(filepath)[0] + ".pdf"
        blob_client = container_client.get_blob_client(blob=preview_file)
    # 両方とも存在しない場合はエラーログを出力
    if not blob_client.exists():
        logging.error(f"Blob not found: {filepath}")
        return error_response("指定されたファイルは存在しません", 404)

    try:
        download_stream = blob_client.download_blob()
        content_data = download_stream.readall()
    except Exception as e:
        logging.error(f"Blob download failed for {filepath}: {e}")
        return error_response("ファイルのダウンロードに失敗しました", 500)

    properties = blob_client.get_blob_properties()
    content_type = (
        properties.content_settings.content_type
        if properties.content_settings and properties.content_settings.content_type
        else "application/octet-stream"
    )
    return func.HttpResponse(
        content_data,
        status_code=200,
        mimetype=content_type,
    )


@app.route(route="get-file-info", methods=["POST"])
@azure_function_get_error_handler
def get_file_info(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    filepath: Optional[str] = req_json.get("filepath")
    if not filepath:
        return error_response("filepathは必須です", 400)
    if os.path.basename(filepath) in HIDDEN_META_FILES:
        logging.error(f"メタファイルへのアクセスがありました {filepath}")
        return error_response("指定したファイルは存在しません", 404)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    if req_json.get("is_split_file", False):
        container_name = os.environ.get("AZURE_STORAGE_SPLIT_FILE_CONTAINER", container_name)
    container_client: ContainerClient = create_container_client(container_name)
    blob_client: BlobClient = container_client.get_blob_client(blob=filepath)
    if not blob_client.exists():
        logging.error(f"Blob not found: {filepath}")
        return error_response("指定されたファイルは存在しません", 404)

    title = blob_client.blob_name.split("/")[-1]
    blob_props = blob_client.get_blob_properties()
    size = blob_props.size
    content_settings = blob_props.content_settings
    content_type = (
        content_settings.content_type
        if content_settings and content_settings.content_type
        else "application/octet-stream"
    )

    return success_response(
        {
            "success": True,
            "title": title,
            "size": size,
            "content_type": content_type,
        }
    )


@app.route(route="create-file", methods=["POST"])
@azure_function_create_error_handler
def create_file(req: func.HttpRequest) -> func.HttpResponse:
    files = req.files
    form = req.form
    if files is None or form is None or "file" not in files or "filename" not in form or "type" not in form:
        return error_response("不正な入力です", 400)
    file = files["file"]
    filename = form["filename"]
    media_type = form["type"]
    container_name = form.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    if os.path.basename(filename) in HIDDEN_META_FILES:
        return error_response("ファイル名が不正です", 403)
    path_route: List[str] = filename.split("/")
    # インデックス配下以外のフォルダ作成は禁止
    if len(path_route) <= 1:
        logging.error(f"不正なファイル作成：{filename}")
        return error_response("指定したフォルダはファイル作成が許可されていません", 403)
    container_client: ContainerClient = create_container_client(container_name)
    blob_client: BlobClient = container_client.get_blob_client(blob=filename)
    # 対象ファイルをbytes型で読み込んでコンテナへアップロード
    if blob_client.exists():  # 同名のファイルが存在するかの判定
        # 存在する場合、上書き登録
        blob_client.upload_blob(
            file,
            overwrite=True,
            content_settings=ContentSettings(content_type=media_type),
        )
    else:
        blob_client.upload_blob(
            file,
            overwrite=False,
            content_settings=ContentSettings(content_type=media_type),
        )
    return success_response({"success": True, "filename": filename})


@app.route(route="rename-file", methods=["POST"])
@azure_function_rename_error_handler
def rename_file(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    old_name = req_json.get("old_name", None)
    new_name = req_json.get("new_name", None)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    if not old_name or not new_name:
        return error_response("old_nameとnew_nameは必須です", 400)
    if os.path.basename(old_name) in HIDDEN_META_FILES or os.path.basename(new_name) in HIDDEN_META_FILES:
        return error_response("ファイル名が不正です", 403)
    path_route: List[str] = new_name.split("/")
    # インデックス配下以外のフォルダ作成は禁止
    if len(path_route) <= 1:
        logging.error(f"不正なファイル作成：{new_name}")
        return error_response("指定したフォルダはファイル作成が許可されていません", 403)
    container_client: ContainerClient = create_container_client(container_name)
    old_blob_client: BlobClient = container_client.get_blob_client(blob=old_name)
    new_blob_client: BlobClient = container_client.get_blob_client(blob=new_name)

    if not old_blob_client.exists():
        return error_response("指定されたファイルは存在しません", 404)
    if new_blob_client.exists():
        return error_response("新しいファイル名が既に存在します", 409)

    # ファイルをコピーして元のファイルを削除
    new_blob_client.start_copy_from_url(old_blob_client.url)
    old_blob_client.delete_blob()

    return success_response({"success": True, "old_name": old_name, "new_name": new_name})


@app.route(route="rename-folder", methods=["POST"])
@azure_function_rename_error_handler
def rename_folder(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    old_prefix = req_json.get("old_prefix", None)
    new_prefix = req_json.get("new_prefix", None)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    if not old_prefix or not new_prefix:
        return error_response("old_prefixとnew_prefixは必須です", 400)
    if os.path.basename(old_prefix) in HIDDEN_META_FILES or os.path.basename(new_prefix) in HIDDEN_META_FILES:
        return error_response("フォルダ名が不正です", 403)
    container_client: ContainerClient = create_container_client(container_name)
    blobs_to_rename = list(container_client.list_blobs(name_starts_with=old_prefix))

    if not blobs_to_rename:
        return error_response("指定されたフォルダは存在しません", 404)

    # 新しいフォルダ内の既存ファイル名を取得
    existing_files = [blob.name for blob in container_client.list_blobs(name_starts_with=new_prefix)]

    for blob in blobs_to_rename:
        old_blob_client: BlobClient = container_client.get_blob_client(blob=blob.name)
        new_blob_name = blob.name.replace(old_prefix, new_prefix, 1)

        # ユニークなファイル名を生成
        new_blob_name = get_unique_file_name(existing_files, new_blob_name)
        existing_files.append(new_blob_name)  # 新しいファイル名をリストに追加

        new_blob_client: BlobClient = container_client.get_blob_client(blob=new_blob_name)

        # ファイルをコピーして元のファイルを削除
        new_blob_client.start_copy_from_url(old_blob_client.url)
        old_blob_client.delete_blob(delete_snapshots="include")

    return success_response({"success": True, "old_prefix": old_prefix, "new_prefix": new_prefix})


@app.route(route="create-folder", methods=["POST"])
@azure_function_create_error_handler
def create_folder(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    folder_name = req_json.get("folder", None)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    if folder_name is None:
        return error_response("フォルダ名は必須です", 400)
    if os.path.basename(folder_name) in HIDDEN_META_FILES:
        return error_response("フォルダ名が不正です", 403)
    path_route: List[str] = folder_name.split("/")
    # インデックス配下以外のフォルダ作成は禁止
    if len(path_route) <= 1:
        logging.error(f"不正なフォルダ作成：{folder_name}")
        return error_response("指定したフォルダは作成が許可されていません", 403)
    container_client = create_container_client(container_name)
    folder_keep_file: str = "/".join([folder_name, FOLDER_KEEP_FILE])
    container_client.get_blob_client(blob=folder_keep_file).upload_blob("", overwrite=True)
    return success_response({"success": True, "folder": folder_name})


@app.route(route="delete-file", methods=["POST"])
@azure_function_delete_error_handler
def delete_file(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    filename = req_json.get("id", None)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    if filename is None:
        return error_response("idは必須です", 400)
    if os.path.basename(filename) in HIDDEN_META_FILES:
        return error_response("ファイル名が不正です", 403)
    container_client = create_container_client(container_name)
    blob_client: BlobClient = container_client.get_blob_client(blob=filename)
    # 対象ファイルを直接削除（BlobDeleted イベント発火）
    if blob_client.exists():
        try:
            blob_client.delete_blob()
            logging.info(f"削除成功: {filename}")
            return success_response({"success": True, "filename": filename})
        except Exception as e:
            logging.error(f"削除失敗: {filename}, エラー: {e}")
            return error_response(f"削除に失敗しました: {str(e)}", 500)
    else:
        logging.info(f"{filename}は既に削除済みです")
        return success_response({"success": True, "filename": filename})


@app.route(route="rmtree", methods=["POST"])
@azure_function_delete_error_handler
def rmtree(req: func.HttpRequest) -> func.HttpResponse:
    req_json = req.get_json()
    prefix: Optional[str] = req_json.get("prefix", None)
    container_name = req_json.get("container_name") or os.environ["AZURE_STORAGE_CONTAINER"]
    if prefix is None:
        return error_response("prefixは必須です", 400)
    path_route: List[str] = prefix.split("/")
    # ルートとインデックス削除は禁止
    if len(path_route) < 2:
        logging.error(f"不正なフォルダの削除：{prefix}")
        return error_response("指定したフォルダは削除が許可されていません", 403)
    # メタファイルの削除は禁止
    if os.path.basename(prefix) in HIDDEN_META_FILES:
        return error_response("フォルダ名が不正です", 403)
    container_client: ContainerClient = create_container_client(container_name)
    deleteItems: List[str] = []
    errorItems: List[str] = []
    file_list: List[str] = [x["name"] for x in container_client.list_blobs(prefix)]
    for file in file_list:
        blob: BlobClient = container_client.get_blob_client(file)
        if blob.exists():
            try:
                # 直接削除（BlobDeleted イベント発火）
                blob.delete_blob()
                deleteItems.append(file)
                logging.info(f"削除成功: {file}")
            except Exception as e:
                logging.error(f"削除失敗: {file}, エラー: {e}")
                errorItems.append(file)
    if errorItems:
        return error_response(
            f"一部のファイルの削除に失敗しました。成功: {len(deleteItems)}件, 失敗: {len(errorItems)}件", 500
        )
    return success_response({"success": True, "files": deleteItems})

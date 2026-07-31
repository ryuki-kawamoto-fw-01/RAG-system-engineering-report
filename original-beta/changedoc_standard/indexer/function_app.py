import base64
import json
import logging
import os
import re
import urllib.parse

import azure.functions as func

app = func.FunctionApp()


@app.function_name(name="decode_split_file_path")
@app.route(route="decode_split_file_path", auth_level=func.AuthLevel.ANONYMOUS)
async def decode_split_file_path(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
        values = body.get("values", [])
        results = []

        for rec in values:
            record_id = rec.get("recordId")
            data = rec.get("data", {})
            # TODO: mainを取り込むと、storage_file_path_name のキー名が変更されているので、対応するキー名に修正が必要
            b64 = data.get("storage_file_path_name", "")
            # デコード実行
            try:
                decoded_bytes = base64.b64decode(b64)
                uri_str = decoded_bytes.decode("utf-8")
                decoded = urllib.parse.unquote(uri_str)
            except Exception as e:
                logging.error(f"[DecodingError] record: {record_id}, err: {e}")
                decoded = ""

            results.append(
                {"recordId": record_id, "data": {"split_file_path": decoded}}
            )

        response_body = {"values": results}
        return func.HttpResponse(
            json.dumps(response_body, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as e:
        logging.error(f"[FunctionError] {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )


@app.function_name(name="decode_source_file_path")
@app.route(route="decode_source_file_path", auth_level=func.AuthLevel.ANONYMOUS)
async def decode_source_file_path(req: func.HttpRequest) -> func.HttpResponse:

    try:
        body = req.get_json()
        values = body.get("values", [])
        results = []

        for rec in values:
            record_id = rec.get("recordId")
            data = rec.get("data", {})
            b64 = data.get("storage_file_path_name", "")
            try:
                decoded_bytes = base64.b64decode(b64)
                uri_str = decoded_bytes.decode("utf-8")
                decoded = urllib.parse.unquote(uri_str)
                # TODO: 本来はpegesplitterで元ファイルのパスを取得し、メタデータに格納する必要があるが、
                # 現状はその処理がないため、ここでファイル名の置換を行っている。
                # ファイル名の -数字.pdf を .pdf に置換
                source_file_path = re.sub(r"-(\d+)(\.pdf)$", r"\2", decoded)
                # 末尾のディレクトリがファイル名（拡張子なし）と一致する場合、そのディレクトリを除去

                dir_path, file_name = os.path.split(source_file_path)
                file_stem, ext = os.path.splitext(file_name)
                dir_parts = dir_path.rstrip("/").split("/")
                if dir_parts and dir_parts[-1] == file_stem:
                    dir_path = "/".join(dir_parts[:-1])
                    source_file_path = (
                        f"{dir_path}/{file_name}" if dir_path else file_name
                    )
            except Exception as e:
                logging.error(f"[filePathDecodingError] record: {record_id}, err: {e}")
                source_file_path = ""

            results.append(
                {"recordId": record_id, "data": {"source_file_path": source_file_path}}
            )

        response_body = {"values": results}
        return func.HttpResponse(
            json.dumps(response_body, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as e:
        logging.error(f"[FunctionError] {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )


@app.function_name(name="decode_description")
@app.route(route="decode_description", auth_level=func.AuthLevel.ANONYMOUS)
async def decode_description(req: func.HttpRequest) -> func.HttpResponse:
    try:
        body = req.get_json()
        values = body.get("values", [])
        results = []

        for rec in values:
            record_id = rec.get("recordId")
            data = rec.get("data", {})
            b64 = data.get("description", "")
            # デコード実行
            try:
                decoded_bytes = base64.b64decode(b64)
                uri_str = decoded_bytes.decode("utf-8")
                decoded = urllib.parse.unquote(uri_str)
            except Exception as e:
                logging.error(f"[DecodingError] record: {record_id}, err: {e}")
                decoded = ""

            results.append({"recordId": record_id, "data": {"description": decoded}})

        response_body = {"values": results}
        return func.HttpResponse(
            json.dumps(response_body, ensure_ascii=False),
            status_code=200,
            mimetype="application/json",
        )

    except Exception as e:
        logging.error(f"[FunctionError] {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )

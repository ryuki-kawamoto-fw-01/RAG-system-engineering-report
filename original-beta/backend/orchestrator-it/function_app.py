import json
import logging

import azure.functions as func

from modules.aoai import create_aoai_answer
from modules.system import get_cve_chat_system_message

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


@app.route(route="cve-report", methods=["POST"])
def cve_report(req: func.HttpRequest) -> func.HttpResponse:

    try:
        form = req.form
        logging.info(f"form: {form}")

        if form is None:
            logging.error("form is required")
            return func.HttpResponse("入力が不正です", status_code=400)

        # フォームデータの取得
        input_text = form.get("cveNumber")
        past_qa = form.get("pastQA")
        current_cve_number = form.get("currentCveNumber")
        logging.info(f"current_cve_number: {current_cve_number}")

        if not input_text:
            logging.error("CVE番号が提供されていません")
            return func.HttpResponse("CVE番号が提供されていません", status_code=400)

        # チャットの処理 #
        chat_messages = [
            {
                "role": "system",
                "content": get_cve_chat_system_message(past_qa, current_cve_number),
            },
            {
                "role": "user",
                "content": f"# 入力メッセージ\n {input_text}",
            },
        ]

        logging.info(f"Chat Messages: {chat_messages}")

        cve_chat, cve_report = create_aoai_answer(chat_messages)
        logging.info(f"cve_chat: {cve_chat}")

        # レスポンスデータの作成
        response_data = {
            "original_text": input_text,
            "cve_chat": cve_chat,
            "cve_report": cve_report,
            "success": True,
        }

        logging.info(f"Response data: {response_data}")

    except Exception as e:
        logging.error(f"Error: {e}")
        error_response = {
            "error": "エラーが発生しました",
            "details": str(e),
            "success": False,
        }
        return func.HttpResponse(
            json.dumps(error_response, ensure_ascii=False),
            status_code=500,
            mimetype="application/json",
        )

    return func.HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

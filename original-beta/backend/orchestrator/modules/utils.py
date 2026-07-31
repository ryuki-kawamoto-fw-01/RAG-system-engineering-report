import json
import azure.functions as func
from typing import Dict, List, Union
from datetime import datetime


def get_current_date_time() -> str:
    now = datetime.now()

    return now.strftime("%Y年%m月%d日 %H時")

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

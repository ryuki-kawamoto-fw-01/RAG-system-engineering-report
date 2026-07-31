import json
import logging

import azure.functions as func

from modules.pii import create_analytics_client
from modules.pii_category import pii_category_mapping

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)


@app.route(route="pii")
def pii(req: func.HttpRequest) -> func.HttpResponse:
    try:
        req_body = req.get_json()

        # PIIに必要な情報を取得
        text = req_body.get("input")  # 入力メッセージを取得
        score_thres = 0.7  # 信頼度の閾値
        lang = "ja"  # 言語指定
        pii_categories = list(pii_category_mapping.keys())  # PIIカテゴリのリスト
        logging.info(f"Input text: {text}")

        # PIIの検出
        recognizer = create_analytics_client()
        response = recognizer.recognize_pii_entities(
            [text],
            language=lang,
            categories_filter=pii_categories,
            domain_filter="phi",
            show_stats=True,
        )

        result = [doc for doc in response if not doc.is_error][0]
        pii_list = []
        for entity in result.entities:
            if entity.confidence_score >= score_thres:
                if entity.category == "Quantity":
                    entity_dict = {
                        "category": pii_category_mapping[entity.subcategory],
                        "text": entity.text,
                        "confidence_score": entity.confidence_score,
                    }
                    pii_list.append(entity_dict)  # type: ignore
                else:
                    entity_dict = {
                        "category": pii_category_mapping[entity.category],
                        "text": entity.text,
                        "confidence_score": entity.confidence_score,
                    }
                    pii_list.append(entity_dict)  # type: ignore

        pii_bool = len(pii_list) > 0
        response_data = {"pii_bool": pii_bool, "pii_list": pii_list}
        logging.info(f"Response: {response_data}")

    except Exception as e:
        logging.error(f"Error: {e}")
        error_response = {"error": "エラーが発生しました", "details": str(e)}
        return func.HttpResponse(
            json.dumps(error_response, ensure_ascii=False), status_code=500, mimetype="application/json"
        )

    return func.HttpResponse(
        json.dumps(response_data, ensure_ascii=False), status_code=200, mimetype="application/json"
    )

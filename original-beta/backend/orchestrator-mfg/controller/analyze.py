import json
import logging

from azure.functions import Blueprint, HttpRequest, HttpResponse
from pydantic import ValidationError

from service.analyze import AnalyzeService
from repository.ai_project import AIProjectRepository

analyze_bp = Blueprint()

@analyze_bp.route(route="analyze", methods=["POST"])
def analyze(req: HttpRequest) -> HttpResponse:
    try:
        response_data = AnalyzeService(
            repository=AIProjectRepository(),
            request=req
        ).post_analyze()

        # レスポンス作成
        return HttpResponse(
            json.dumps(response_data, ensure_ascii=False),
            status_code=200,
            mimetype="application/json"
        )

    except ValidationError as e:
        logging.info(f"Validation Error: {e}")
        return HttpResponse(
            json.dumps(
                {
                    "error": "バリデーションエラーが発生しました",
                    "message": str(e),
                }
            ),
            status_code=400,
            mimetype="application/json",
        )
    except Exception as e:
        logging.error(f"Error: {e}")
        return HttpResponse(
            json.dumps({"error": "エラーが発生しました", "message": str(e)}),
            status_code=500,
            mimetype="application/json",
        )
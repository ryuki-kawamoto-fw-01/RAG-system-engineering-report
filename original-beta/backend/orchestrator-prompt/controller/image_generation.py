import requests
from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.fix_image import FixImageService  # 必要なら追加
from service.image_generation import ImageGenerationService

image_generation_bp = Blueprint()


@image_generation_bp.route(route="image-generation", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def image_generation(req: HttpRequest) -> HttpResponse:
    response_data = ImageGenerationService(
        repository=AoaiRepository, request=req
    ).post_image_generation()

    # JSONレスポンスとして返す
    return HttpResponse(
        body=requests.compat.json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@image_generation_bp.route(route="fix-image", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def fix_image(req: HttpRequest) -> HttpResponse:

    service = FixImageService(repository=AoaiRepository, request=req)
    response_data = service.post_create_fix_image()

    # JSONレスポンスとして返す
    return HttpResponse(
        body=requests.compat.json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

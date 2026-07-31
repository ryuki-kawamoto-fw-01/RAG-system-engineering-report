import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.create_new_product_name import CreateNewProductnameService
from service.create_product_name import CreateProductNameService

product_name_bp = Blueprint()


@product_name_bp.route(route="create-productname", methods=["POST"])
@azure_function_error_handler
def create_productname(req: HttpRequest) -> HttpResponse:

    response_data = CreateProductNameService(
        repository=AoaiRepository(), request=req
    ).post_create_productname()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


@product_name_bp.route(route="create-new-productname", methods=["POST"])
@azure_function_error_handler
def create_new_productname(req: HttpRequest) -> HttpResponse:

    response_data = CreateNewProductnameService(
        repository=AoaiRepository(), request=req
    ).post_create_new_productname()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

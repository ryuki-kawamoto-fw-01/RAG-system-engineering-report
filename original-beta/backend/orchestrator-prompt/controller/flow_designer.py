import json

from azure.functions import Blueprint, HttpRequest, HttpResponse

from modules.contextLog.logger import trace_http_azure
from modules.error_handler import azure_function_error_handler
from repository.aoai import AoaiRepository
from service.flow_designer import FixFlowDesignerService, FlowDesignerService

flowDesigner_bp = Blueprint()


# 新規作成
@flowDesigner_bp.route(route="flow-designer", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def flow_designer(req: HttpRequest) -> HttpResponse:
    response_data = FlowDesignerService(
        repository=AoaiRepository(), request=req
    ).post_flow_designer()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )


# 結果調整
@flowDesigner_bp.route(route="fix-flow-designer", methods=["POST"])
@azure_function_error_handler
@trace_http_azure()
def fix_flow_designer(req: HttpRequest) -> HttpResponse:
    response_data = FixFlowDesignerService(
        repository=AoaiRepository(), request=req
    ).post_fix_flow_designer()

    return HttpResponse(
        json.dumps(response_data, ensure_ascii=False),
        status_code=200,
        mimetype="application/json",
    )

import json
import logging
import os

from azure.durable_functions import Blueprint, DurableOrchestrationContext
from azure.functions import HttpRequest, HttpResponse

from models.api import Query, Response
from services.deep_research_main import deep_research

# logging.basicConfig(
#     level=os.getenv("LOG_LEVEL", "INFO"),
#     format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
#     handlers=[
#         logging.FileHandler(f"deep_research_durable.log", encoding="utf-8"),
#         logging.StreamHandler(),
#     ],
# )
# logger = logging.getLogger(__name__)


durable_deep_research_bp = Blueprint()


@durable_deep_research_bp.route(route="startOrchestrator")
@durable_deep_research_bp.durable_client_input(client_name="client")
async def start_orchestrator(req: HttpRequest, client):
    try:
        req_body = req.get_json()
        query_obj = Query(**req_body)
        instance_id = await client.start_new("my_orchestrator", None, query_obj.query)
        logging.info(f"Started orchestration with ID = '{instance_id}'.")
        return client.create_check_status_response(req, instance_id)
    except Exception as e:
        # logger.error(f"Error: {e}")
        return HttpResponse(
            json.dumps({"error": "エラーが発生しました", "message": str(e)}),
            status_code=400,
            mimetype="application/json",
        )


@durable_deep_research_bp.orchestration_trigger(context_name="context")
def my_orchestrator(context: DurableOrchestrationContext):
    query = context.get_input()
    result = yield context.call_activity("activity_deep_research", query)
    return result


@durable_deep_research_bp.activity_trigger(input_name="query")
def activity_deep_research(query: str) -> tuple[str, list[dict[str, str]]]:
    # Durable Functions 動作テスト用
    # import time
    # time.sleep(30)
    # final_output = "processed: " + query
    # sources = []

    final_output, sources = deep_research(query)

    return final_output, [source.model_dump() for source in sources]


@durable_deep_research_bp.route(route="getResult")
@durable_deep_research_bp.durable_client_input(client_name="client")
async def get_result(req: HttpRequest, client):
    instance_id = req.params.get("instance_id")
    if not instance_id:
        return HttpResponse(
            json.dumps({"error": "Instance ID is required as a query parameter"}),
            status_code=400,
            mimetype="application/json",
        )

    status = await client.get_status(instance_id)

    if status.runtime_status.name in ["Completed"]:
        result = status.output
        return HttpResponse(
            json.dumps({"result": result}),
            status_code=200,
            mimetype="application/json",
        )
    elif status.runtime_status.name in ["Failed", "Terminated"]:
        return HttpResponse(
            json.dumps({"error": "Orchestration failed or was terminated"}),
            status_code=500,
            mimetype="application/json",
        )
    else:
        return HttpResponse(
            json.dumps(
                {
                    "status": status.runtime_status.name,
                    "message": "Orchestration is still running",
                }
            ),
            status_code=202,
            mimetype="application/json",
        )

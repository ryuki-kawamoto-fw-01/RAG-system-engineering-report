from fastapi import APIRouter

from models.api import Query, Response
from services.deep_research_main import deep_research

router = APIRouter(
    prefix="/query",
    tags=["query"],
)


@router.post("/", response_model=Response, summary="Process a query")
async def process_query(query: Query):
    """
    Process an input query and return the result.

    Args:
        query (Query): The input query model containing the query string.

    Returns:
        Response: The response model containing the final output.
    """
    final_output, sources = deep_research(query.query)
    return Response(final_output=final_output, sources=sources)

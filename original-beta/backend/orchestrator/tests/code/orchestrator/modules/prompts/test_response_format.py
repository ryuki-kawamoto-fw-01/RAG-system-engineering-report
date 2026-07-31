import sys
from pathlib import Path

import pytest
from pydantic import ValidationError


def _add_orchestrator_to_syspath() -> None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "backend" / "orchestrator"
        if (candidate / "function_app.py").exists():
            sys.path.insert(0, str(candidate))
            return
    raise RuntimeError("Could not locate backend/orchestrator to add to sys.path")


_add_orchestrator_to_syspath()

import modules.prompts.response_format as target  # noqa: E402


def test_web_search_parameters_accepts_query():
    # N-01-001
    params = target.WebSearchParameters(query="q")
    assert params.query == "q"


def test_web_search_parameters_missing_query_raises():
    # E-01-001
    with pytest.raises(ValidationError):
        target.WebSearchParameters()


def test_ranked_result_accepts_fields():
    # N-01-002
    result = target.RankedResult(
        title="t",
        url="u",
        snippet="s",
        reason="r",
        score=1,
        rank=1,
    )
    assert result.title == "t"


def test_rerank_response_format_search_result_with_one_item():
    # L-01-001
    response = target.RerankResponse(
        summary="s",
        rankedResults=[
            target.RankedResult(
                title="t",
                url="u",
                snippet="s",
                reason="r",
                score=1,
                rank=1,
            )
        ],
    )
    formatted = response.format_search_result()
    assert formatted[0]["id"] == 1


def test_rerank_response_format_search_result_empty_raises():
    # E-01-002
    response = target.RerankResponse(summary="s", rankedResults=[])
    with pytest.raises(ValueError):
        response.format_search_result()


def test_keyword_variation_response_allows_single_item():
    # L-01-002
    response = target.KeywordVariationResponse(
        keywords=[target.KeywordVariation(id=1, keyword="k")]
    )
    assert response.keywords[0].keyword == "k"


def test_function_schemas_match_model_json_schema():
    # I-01-001
    assert target.VARIY_KEYWORDS_FUNCTION["parameters"] == (
        target.KeywordVariationResponse.model_json_schema()
    )
    assert target.RERANK_FUNCTION["parameters"] == (
        target.RerankResponse.model_json_schema()
    )

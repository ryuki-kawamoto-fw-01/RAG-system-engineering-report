from pydantic import BaseModel, Field

from .deep_research import Source


class Query(BaseModel):
    query: str = Field(..., description="The input query string")


class Response(BaseModel):
    final_output: str = Field(..., description="The final output string")
    sources: list[Source] = Field(
        default_factory=list, description="List of sources related to the content"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "final_output": "Processed result of the query",
                "sources": [{"title": "Example Title", "url": "http://example.com"}],
            }
        }

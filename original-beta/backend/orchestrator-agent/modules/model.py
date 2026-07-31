from dataclasses import dataclass
from typing import List, Dict, Optional, Union, TypedDict, Any
from pydantic import BaseModel, Field

@dataclass
class Media:
    file_name: str
    media_type: str
    file_content: Optional[str] = None
    image_url: Optional[str] = None


class FunctionDefinition(TypedDict):
    name: str
    arguments: str


class ToolCall(TypedDict):
    id: str
    type: str
    function: FunctionDefinition


class ChatResponse(TypedDict):
    content: str
    tool_calls: List[ToolCall]


class PlanningUseCaseData(TypedDict):
    plan: List[ToolCall]
    messages: List[dict]
    user_message_rev: str
    desc: str
    content: Optional[str]


class ToolUseUseCaseData(TypedDict):
    messages: List[dict]
    tool_outputs: List[dict]


class ReflectionUseCaseData(TypedDict):
    messages: List[dict]
    complete: bool
    tool_calls: List[ToolCall]
    desc: str


class MergeUseCaseData(TypedDict):
    messages: List[dict]
    answer: str

class PdfToImagePromptUseCaseData(TypedDict):
    messages: List[Dict[str, Any]]
    tool_outputs: List[dict]

class WordEntry(BaseModel):
    terms: Union[str, List[str]] = Field(
        description="用語（文字列または文字列のリスト）"
    )
    uniform_name: str = Field(description="統一表現")
    description: str = Field(description="説明文")

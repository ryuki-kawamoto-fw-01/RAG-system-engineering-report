import json
import traceback
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from openai.types.chat import ChatCompletion
from pydantic import BaseModel, ConfigDict, Field, field_serializer
from typing_extensions import TypedDict


class LogBase(BaseModel):
    log_id: str
    timestamp: str
    session_id: str


class ContextMetadata(BaseModel):
    """コンテキストメタデータ
    logの検索に使用される
    """

    llm_name: str
    llm_type: str
    function_name: Optional[str] = None
    tags: list[str] = Field(default_factory=list)


class TokenUsage(TypedDict):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ErrorLog(BaseModel):
    """エラーログ出力のスキーマ"""

    error_from: str
    error_message: str
    stack_trace: str


class ContextInfo(BaseModel):
    """コンテキスト情報を表すスキーマ"""

    llm_name: str
    llm_type: str
    function_name: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    input_type: str
    input_value: Any = Field(default=None)
    output_type: str
    token_usage: TokenUsage

    @field_serializer("input_value")
    def serialize_input_value(self, input_value: Any) -> Any:
        if isinstance(input_value, (ChatCompletion, dict, list)):
            return json.loads(json.dumps(input_value, default=str))
        return input_value

    def as_success(
        self, output: Any, delay_time: float, token_usage: Optional[TokenUsage] = None
    ) -> "SuccessLog":
        data = self.model_dump()
        if token_usage is not None:
            data["token_usage"] = token_usage

        # ChatCompletionの場合は変換
        if isinstance(output, ChatCompletion):
            output = ChatCompletionResponse.from_openai_response(output)

        return SuccessLog(
            successful=True, output_value=output, delay_time=delay_time, **data
        )

    def as_failure(
        self,
        error: BaseException,
        delay_time: float,
        token_usage: Optional[TokenUsage] = None,
    ) -> "FailureLog":
        data = self.model_dump()
        if token_usage is not None:
            data["token_usage"] = token_usage

        return FailureLog(
            successful=False,
            delay_time=delay_time,
            error_log=ErrorLog(
                error_from=type(error).__name__,
                error_message=str(error),
                stack_trace=traceback.format_exc(),
            ),
            **data,
        )


class SuccessLog(ContextInfo):
    successful: bool = True
    delay_time: float
    output_value: Any = Field(default=None)

    @field_serializer("output_value")
    def serialize_output_value(self, output_value: Any) -> Any:
        if isinstance(output_value, ChatCompletionResponse):
            return output_value.model_dump()
        if isinstance(output_value, (ChatCompletion, dict, list)):
            return json.loads(json.dumps(output_value, default=str))
        return output_value


class FailureLog(ContextInfo):
    successful: bool = False
    delay_time: float
    error_log: ErrorLog


ContextLog = SuccessLog | FailureLog


class ChatCompletionResponse(BaseModel):
    """OpenAIのレスポンスを格納するためのモデル"""

    id: str
    choices: List[Dict[str, Any]]
    usage: Optional[TokenUsage] = None
    model: str

    @classmethod
    def from_openai_response(cls, response: ChatCompletion) -> "ChatCompletionResponse":
        return cls(
            id=response.id,
            choices=[
                {
                    "message": {
                        "content": choice.message.content,
                        "role": choice.message.role,
                    },
                    "finish_reason": choice.finish_reason,
                    "index": choice.index,
                }
                for choice in response.choices
            ],
            usage=TokenUsage(
                prompt_tokens=response.usage.prompt_tokens,
                completion_tokens=response.usage.completion_tokens,
                total_tokens=response.usage.total_tokens,
            )
            if response.usage
            else None,
            model=response.model,
        )


class TraceLog(BaseModel):
    """トレースログを表すスキーマ"""

    trace_id: str
    parent_run_id: Optional[str] = None
    chat_history: Optional[List[Dict[str, Any]]] = None
    flow_history: Optional[Dict[str, "RunLog"]] = None
    # log for agent is not implemented yet
    # agent_state: Optional[Dict[str, str]]

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            ChatCompletion: lambda v: ChatCompletionResponse.from_openai_response(
                v
            ).model_dump(),
        },
    )


class RunLog(BaseModel):
    """ログ出力の基本スキーマ"""

    logId: str
    contextLog: Union[SuccessLog, FailureLog]
    traceLog: Optional[TraceLog] = None

    model_config = ConfigDict(
        populate_by_name=True,  # 名前による設定を許可
        validate_assignment=True,  # 代入時の検証を有効化
        extra="allow",  # 追加のフィールドを許可
        arbitrary_types_allowed=True,  # 任意の型を許可
        json_encoders={
            datetime: lambda v: v.isoformat(),
            ChatCompletion: lambda v: ChatCompletionResponse.from_openai_response(
                v
            ).model_dump(),
        },
    )


class LogOutput(RunLog):
    """ログ出力のスキーマ"""

    user_id: Optional[str] = None
    session_id: Optional[str] = None

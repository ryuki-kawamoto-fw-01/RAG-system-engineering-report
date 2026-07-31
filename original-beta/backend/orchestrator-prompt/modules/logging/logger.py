import functools
import inspect

# import functools
import json
import sys
import traceback
import uuid
from contextvars import ContextVar
from datetime import datetime
from inspect import iscoroutinefunction
from types import TracebackType
from typing import Any, Callable, Dict, List, Optional, Type, TypeVar, Union

from azure.functions import HttpRequest, HttpResponse
from modules.logging.scheme import ContextInfo, RunLog, TokenUsage, TraceLog
from openai import AsyncOpenAI, OpenAI
from openai.types import Completion
from openai.types.chat import ChatCompletion, ChatCompletionMessageToolCall

"""ログモジュール
1. to warp openai client for logging
2. to log with context or run object
"""

C = TypeVar("C", bound=Union["OpenAI", "AsyncOpenAI", Any])
ModelOutput = (
    str | int | float | bool | list[Any] | dict[str, Any] | Completion | ChatCompletion
)


CURRENT_RUN: ContextVar[Optional["RunTree"]] = ContextVar("current_run", default=None)
SESSION_ID: ContextVar[str] = ContextVar("session_id", default=str(uuid.uuid4()))


def create_context_info(
    llm_type: str,
    input_value: Any,
    tags: List[str],
    parent_run_id: Optional[str] = None,
    function_name: Optional[str] = None,
    chat_history: Optional[List[Dict[str, str]]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> ContextInfo:
    return ContextInfo(
        tags=tags,
        input_type=metadata.get("input_type", "text") if metadata else "text",
        output_type=metadata.get("output_type", "text") if metadata else "text",
        input_value=input_value,
        token_usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        llm_name=metadata.get("llm_name", "") if metadata else "",
        llm_type=llm_type,
        function_name=function_name,
    )


def retrieve_usage_info(chat_completion: ChatCompletion) -> Optional[Dict[str, int]]:
    """OpenAI APIのレスポンスから使用量情報を取得"""
    if not chat_completion.usage:
        return None
    return {
        "prompt_tokens": chat_completion.usage.prompt_tokens,
        "completion_tokens": chat_completion.usage.completion_tokens,
        "total_tokens": chat_completion.usage.total_tokens,
    }


class RunTree:
    """実行コンテキストを管理するクラス"""

    def __init__(
        self,
        context_info: ContextInfo,
        run_id: Optional[str] = None,
        parent_run_id: Optional[str] = None,
    ):
        self.run_id = run_id or str(uuid.uuid4())
        self.parent_run_id = parent_run_id
        self.start_time = datetime.now()
        self.end_time: datetime | None = None
        self.context_info = context_info
        self.children: List[RunTree] = []
        self.run_log: RunLog | None = None
        self.trace_log: TraceLog | None = None
        self.output_value: ModelOutput | None = None
        self.is_end: bool = False

    def add_child(self, child: "RunTree") -> None:
        self.children.append(child)

    # It seems that this method occure Exception: TypeError: 'MockValSer' object cannot be converted to 'SchemaSerializer'
    def create_child(
        self,
        llm_type: str,
        input_value: Any,
        tags: List[str],
        name: Optional[str] = None,
        parent_run_id: Optional[str] = None,
        function_name: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        metadata: Dict[str, Any] = {},
    ) -> "RunTree":
        if name is None:
            function_name = inspect.stack()[0][3]
        else:
            function_name = name

        context_info: ContextInfo = create_context_info(
            llm_type=llm_type,
            input_value=input_value,
            tags=tags,
            parent_run_id=parent_run_id,
            function_name=function_name,
            chat_history=chat_history,
            metadata=metadata,
        )
        child = RunTree(context_info, parent_run_id=self.run_id)
        self.add_child(child)
        CURRENT_RUN.set(child)
        return child

    @staticmethod
    def retrieve_usage_info(
        chat_completion: ChatCompletion | Completion,
    ) -> TokenUsage | None:
        """OpenAI APIのレスポンスから使用量情報を取得"""
        usage = chat_completion.usage
        if usage is None:
            return None
        return TokenUsage(
            prompt_tokens=usage.prompt_tokens,
            completion_tokens=usage.completion_tokens,
            total_tokens=usage.total_tokens,
        )

    def set_chat_history(
        self, chat_history: List[Dict[str, str | List[ChatCompletionMessageToolCall]]]
    ) -> None:
        """ChatCompletionMessageToolCallをシリアライズ可能な形式に変換してchat_historyを設定する"""
        serializable_history = []
        for message in chat_history:
            serialized_message = message.copy()
            if "tool_calls" in message:
                tool_calls = message["tool_calls"]
                if isinstance(tool_calls, list):
                    serialized_tool_calls = []
                    for tool_call in tool_calls:
                        if isinstance(tool_call, ChatCompletionMessageToolCall):
                            serialized_tool_calls.append(
                                {
                                    "id": tool_call.id,
                                    "type": tool_call.type,
                                    "function": {
                                        "name": tool_call.function.name,
                                        "arguments": tool_call.function.arguments,
                                    },
                                }
                            )
                        else:
                            serialized_tool_calls.append(tool_call)
                    serialized_message["tool_calls"] = serialized_tool_calls
            serializable_history.append(serialized_message)

        self.chat_history = serializable_history

    def output(self, output: ModelOutput) -> None:
        self.output_value = output

    def end(
        self,
        error: Optional[BaseException] = None,
        output: Optional[ModelOutput] = None,
        additional_info: Optional[Dict[str, Any]] = None,
    ) -> RunLog:
        if self.is_end:
            if self.run_log is not None:
                return self.run_log
            else:
                raise ValueError("Run log is not set")

        self.end_time = datetime.now()

        # トークン使用量を集計
        total_token_usage = self._calculate_total_token_usage()

        if error is not None:
            self.run_log = self._log_error(error, token_usage=total_token_usage)
        else:
            if output is not None:
                self.output_value = output
            if self.output_value is not None:
                if isinstance(self.output_value, (Completion, ChatCompletion)):
                    current_usage = RunTree.retrieve_usage_info(self.output_value)
                    if current_usage is not None:
                        self.context_info.token_usage = current_usage
            self.run_log = self._log_output(token_usage=total_token_usage)
        self.is_end = True
        return self.run_log

    def _calculate_total_token_usage(self) -> TokenUsage:
        """子ノードを含む合計トークン使用量を計算"""
        total = {
            "prompt_tokens": self.context_info.token_usage["prompt_tokens"],
            "completion_tokens": self.context_info.token_usage["completion_tokens"],
            "total_tokens": self.context_info.token_usage["total_tokens"],
        }

        for child in self.children:
            if child.context_info.token_usage:
                total["prompt_tokens"] += child.context_info.token_usage[
                    "prompt_tokens"
                ]
                total["completion_tokens"] += child.context_info.token_usage[
                    "completion_tokens"
                ]
                total["total_tokens"] += child.context_info.token_usage["total_tokens"]

        return TokenUsage(**total)

    def create_trace_log(self) -> TraceLog:
        new_trace_log: dict[str, RunLog] = {}
        list_prompt_tokens: list[int] = [
            self.context_info.token_usage["prompt_tokens"]
            if self.context_info.token_usage
            else 0
        ]
        list_completion_tokens: list[int] = [
            self.context_info.token_usage["completion_tokens"]
            if self.context_info.token_usage
            else 0
        ]
        list_total_tokens: list[int] = [
            self.context_info.token_usage["total_tokens"]
            if self.context_info.token_usage
            else 0
        ]

        # 子ノードのトレース情報を収集
        for child in self.children:
            if child.run_log:
                if child.context_info.function_name:
                    new_trace_log[child.context_info.function_name] = child.run_log
                    # if child.context_info.token_usage is not None:
                    list_prompt_tokens.append(
                        child.context_info.token_usage["prompt_tokens"]
                    )
                    list_completion_tokens.append(
                        child.context_info.token_usage["completion_tokens"]
                    )
                    list_total_tokens.append(
                        child.context_info.token_usage["total_tokens"]
                    )
                else:
                    new_trace_log[child.run_id] = child.run_log

        self.context_info.token_usage = TokenUsage(
            prompt_tokens=sum(list_prompt_tokens),
            completion_tokens=sum(list_completion_tokens),
            total_tokens=sum(list_total_tokens),
        )

        # chat_historyが存在する場合は、それも含める
        chat_history = getattr(self, "chat_history", None)

        return TraceLog(
            trace_id=self.run_id,
            parent_run_id=self.parent_run_id,
            chat_history=chat_history,  # chat_historyを含める
            flow_history=new_trace_log if new_trace_log else None,
        )

    def _log_output(self, token_usage: Optional[TokenUsage] = None) -> RunLog:
        if not self.context_info:
            raise ValueError("Context info is not set")

        delay_time = (datetime.now() - self.start_time).total_seconds()
        success_log = self.context_info.as_success(
            output=self.output_value, delay_time=delay_time, token_usage=token_usage
        )

        # トレースログを作成し、必要な場合のみ含める
        trace_log = self.create_trace_log()
        if trace_log and (
            trace_log.chat_history is not None or trace_log.flow_history is not None
        ):
            trace_log_to_include = trace_log
        else:
            trace_log_to_include = None

        return RunLog(
            logId=str(uuid.uuid4()),
            contextLog=success_log,
            traceLog=trace_log_to_include,
        )

    def _create_error_detail(
        self,
        error: Exception,
        severity: str = "ERROR",
        additional_info: Optional[Dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """エラー詳細の作成"""
        _, _, exc_traceback = sys.exc_info()

        # トレースバック情報の取得
        tb_list = traceback.extract_tb(exc_traceback)
        formatted_tb = []
        for filename, line, func, text in tb_list:
            formatted_tb.append(
                {"filename": filename, "line": line, "function": func, "text": text}
            )

        return {
            "error_id": str(uuid.uuid4()),
            "error_type": error.__class__.__name__,
            "error_message": str(error),
            "stack_trace": traceback.format_exc(),
            "timestamp": datetime.now().isoformat(),
            "severity": severity,
            "additional_info": {
                "traceback_details": formatted_tb,
                "sys_info": {"python_version": sys.version, "platform": sys.platform},
                **(additional_info or {}),
            },
        }

    def _log_error(
        self, error: BaseException, token_usage: Optional[TokenUsage] = None
    ) -> RunLog:
        if not self.context_info:
            raise ValueError("Context info is not set")

        delay_time = (datetime.now() - self.start_time).total_seconds()
        failure_log = self.context_info.as_failure(
            delay_time=delay_time, error=error, token_usage=token_usage
        )

        # トレースログを作成し、必要な場合のみ含める
        trace_log = self.create_trace_log()
        if trace_log and (
            trace_log.chat_history is not None or trace_log.flow_history is not None
        ):
            trace_log_to_include = trace_log
        else:
            trace_log_to_include = None

        return RunLog(
            logId=str(uuid.uuid4()),
            contextLog=failure_log,
            traceLog=trace_log_to_include,
        )


class Logger:
    """ロギング機能を提供するクラス"""

    def __init__(self):
        self._current_run = ContextVar("current_run", default=None)
        self._session_id: ContextVar[str] = ContextVar(
            "session_id", default=str(uuid.uuid4())
        )

    def start_run(
        self,
        user_id: str,
        llm_type: str,
        input_value: Any,
        chat_history: Optional[
            List[Dict[str, str | List[ChatCompletionMessageToolCall]]]
        ] = None,
        tags: List[str] = [],
        parent_run_id: Optional[str] = None,
        parent_run: Optional[RunTree] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RunTree:
        """新しい実行コンテキストを開始"""
        parent_run = CURRENT_RUN.get() if parent_run is None else parent_run
        import logging

        logging.info(f"parent_run: {parent_run}")
        function_name = metadata.get("function_name") if metadata else None

        context_info = create_context_info(
            tags=tags,
            input_value=input_value,
            llm_type=llm_type,
            function_name=function_name,
            metadata=metadata,
        )

        run = RunTree(
            parent_run_id=parent_run.run_id if parent_run else None,
            context_info=context_info,
        )

        # chat_historyを設定
        if chat_history is not None:
            run.set_chat_history(chat_history)

        if parent_run is not None:
            parent_run.add_child(run)
            CURRENT_RUN.set(run)
        else:
            CURRENT_RUN.set(run)
        return run

    def end_run(
        self,
        run: RunTree,
        output: ModelOutput | None,
        error: Optional[BaseException] = None,
        severity: str = "ERROR",
        additional_info: Optional[Dict[str, Any]] = None,
    ) -> RunLog:
        """実行コンテキストを終了し、ログを返す"""

        if output is not None:
            run.output(output)

        return run.end(error)


class LoggerContext:
    def __init__(
        self,
        logger: Logger,
        user_id: str,
        llm_type: str,
        input_value: Any,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.logger = logger
        self.user_id = user_id
        self.input_value = input_value
        self.llm_type = llm_type
        self.metadata = metadata or {}
        self.run: Optional[RunTree] = None
        self.previous_run: Optional[RunTree] = None

    def __enter__(self) -> RunTree:
        # 現在のコンテキストを保存
        self.previous_run = CURRENT_RUN.get()

        # 新しいRunTreeを作成
        self.run = self.logger.start_run(
            user_id=self.user_id,
            input_value=self.input_value,
            llm_type=self.llm_type,
            metadata=self.metadata,
            parent_run=self.previous_run,
        )
        return self.run

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exctb: Optional[TracebackType],
    ) -> None:
        try:
            if self.run:
                if exc_val:
                    import logging
                    logging.info(f"exc_val: {exc_val}")
                    severity = (
                        "CRITICAL" if isinstance(exc_val, SystemError) else "ERROR"
                    )
                    self.logger.end_run(
                        run=self.run,
                        output=None,
                        error=exc_val,
                        severity=severity,
                        additional_info={
                            "context": "LoggerContext.__exit__",
                            "exc_type": exc_type.__name__ if exc_type else None,
                        },
                    )
                self.logger.end_run(self.run, None, error=exc_val)
        finally:
            # 元のコンテキストを復元
            CURRENT_RUN.set(self.previous_run)


logger = Logger()


def trace(
    user_id: str,
    llm_type: str,
    input_value: Any,
    name: str,
    metadata: Dict[str, Any] = {},
):  # type: ignore
    metadata["function_name"] = name

    return LoggerContext(logger, user_id, llm_type, input_value, metadata)  # type: ignore


# デコレータとて使用する例
def log_operation(
    llm_type: str,
    input_value: Any = None,
    name: Optional[str] = None,
    metadata: Dict[str, Any] = {},
):
    def decorator(func: Callable[..., Any]):
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # 関数の入力を取得
            actual_input = {
                "args": [
                    str(arg) if isinstance(arg, HttpRequest) else arg
                    for arg in args[1:]
                ]
                if len(args) > 0
                else [],
                "kwargs": {
                    k: str(v) if isinstance(v, HttpRequest) else v
                    for k, v in kwargs.items()
                },
            }

            if name is None:
                metadata["function_name"] = func.__name__
            else:
                metadata["function_name"] = name

            # input_valueが指定されいない場合は実際入力を使用
            context_input = input_value if input_value is not None else actual_input

            context = LoggerContext(
                logger=logger,
                user_id="user123",
                llm_type=llm_type,
                input_value=context_input,
                metadata=metadata,
            )

            with context as run:
                if iscoroutinefunction(func):
                    raise ValueError("Coroutine function is not supported")

                result = func(*args, **kwargs)

                if isinstance(result, HttpResponse):
                    if result.mimetype == "application/json":
                        body = json.loads(result.get_body())
                        runlog = run.end()
                        if runlog:
                            # JSONシリアライズ可能な形式に変換
                            log_dict = runlog.model_dump(
                                exclude_none=True,
                                exclude_unset=True,
                                mode="json",  # JSONシリアライズ用のモード
                            )
                            body["log"] = log_dict

                        return HttpResponse(
                            body=json.dumps(body, ensure_ascii=False),
                            status_code=result.status_code,
                            mimetype=result.mimetype,
                        )
                else:
                    run.output(result)
                    return result

        return wrapper

    return decorator

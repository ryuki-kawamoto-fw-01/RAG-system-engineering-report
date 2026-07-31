import functools
import inspect
import json
import sys
import time
from contextvars import ContextVar
from inspect import iscoroutinefunction
from types import TracebackType
from typing import Any, Callable, Dict, Optional, Type

from azure.functions import HttpResponse
from pydantic import BaseModel

# Import the new schema
from modules.contextLog.scheme import CollectedData

# --- Context Management (Simplified) ---

CURRENT_CONTEXT: ContextVar[Optional["RunContext"]] = ContextVar(
    "current_context", default=None
)

LOG_KEY: str = "log_data"


def get_current_context() -> Optional["RunContext"]:
    """Get the currently active RunContext."""
    return CURRENT_CONTEXT.get()


class RunContext:
    """Manages the state and data for a single execution context/run."""

    def __init__(
        self,
        function_name: Optional[str] = None,
        parent_context: Optional["RunContext"] = None,
    ):
        self.function_name = function_name
        self.parent_context = parent_context
        self._data: Dict[str, Any] = {}
        self._is_ended: bool = False

    @property
    def is_ended(self) -> bool:
        """Returns True if the context has ended."""
        return self._is_ended

    def add_data(self, key: str, value: Any) -> None:
        """Add key-value data to the current run context."""
        if self._is_ended:
            print(
                f"Warning: Attempted to add data to already ended context ({self.function_name})",
                file=sys.stderr,
            )
            return
        self._data[key] = value

    def get_data(self) -> Dict[str, Any]:
        """Returns the data collected within this context."""
        return self._data.copy()

    def end(self) -> CollectedData:
        """Marks the context as ended and returns the collected data object."""
        if self._is_ended:
            print(
                f"Warning: Context ({self.function_name}) already ended.",
                file=sys.stderr,
            )
        self._is_ended = True
        return CollectedData(function_name=self.function_name, data=self._data)

    def merge_child_data(self, child_data: Dict[str, Any]):
        """Merges data from a child context into this context's data."""
        if self._is_ended:
            print(
                f"Warning: Attempted to merge data into already ended context ({self.function_name})",
                file=sys.stderr,
            )
            return
        self._data.update(child_data)


class Logger:
    """Provides methods to start/end contexts and add data."""

    def start_context(
        self,
        function_name: Optional[str] = None,
        parent_context: Optional[RunContext] = None,
    ) -> RunContext:
        """Starts a new value collection context."""
        _parent_ctx = parent_context or CURRENT_CONTEXT.get()

        if function_name is None:
            stack = None
            try:
                stack = inspect.stack()
                if len(stack) > 1:
                    caller_frame = stack[1].frame
                    if caller_frame.f_code.co_name == "__enter__":
                        if len(stack) > 2:
                            caller_frame = stack[2].frame
                        else:
                            function_name = "unknown_context_enter"
                    elif caller_frame.f_code.co_name == "wrapper" and len(stack) > 2:
                        caller_frame = stack[2].frame

                    function_name = caller_frame.f_code.co_name
                else:
                    function_name = "unknown_context"
            except Exception as e:
                print(f"Warning: Failed to inspect function name: {e}", file=sys.stderr)
                function_name = "unknown_inspect_error"
            finally:
                if stack is not None:
                    del stack

        context = RunContext(function_name=function_name, parent_context=_parent_ctx)
        CURRENT_CONTEXT.set(context)
        return context

    def end_context(self, context: RunContext) -> CollectedData:
        """Ends the context, merges data to parent, and returns collected data."""
        collected_data_obj = context.end()

        if context.parent_context:
            context.parent_context.merge_child_data(collected_data_obj.data)

        CURRENT_CONTEXT.set(context.parent_context)
        return collected_data_obj

    def add_data(self, key: str, value: Any) -> None:
        """Adds data to the currently active context."""
        current_context = get_current_context()
        if current_context:
            current_context.add_data(key, value)
        else:
            print(
                "Warning: add_data called outside of a running context. Data will be lost.",
                file=sys.stderr,
            )


class LoggerContext:
    """Context manager for managing value collection contexts using 'with' statement."""

    def __init__(
        self,
        logger_instance: Logger,
        function_name: Optional[str] = None,
    ):
        self.logger = logger_instance
        self.function_name = function_name
        self.context: Optional[RunContext] = None
        self._collected_data_obj: Optional[CollectedData] = None

    def __enter__(self) -> RunContext:
        """Starts the context when entering the 'with' block."""
        self.context = self.logger.start_context(function_name=self.function_name)
        return self.context

    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        """Ends the context and merges data to parent when exiting the 'with' block."""
        if self.context:
            self._collected_data_obj = self.logger.end_context(context=self.context)

    def get_collected_data(self) -> Optional[CollectedData]:
        """Returns the data collected within this specific context after it has ended."""
        if self._collected_data_obj:
            return self._collected_data_obj
        else:
            print(
                "Warning: get_collected_data called before context ended.",
                file=sys.stderr,
            )
            return None

    def get_final_merged_data(self) -> Dict[str, Any]:
        """Returns the final merged data dictionary held by this context after it has ended."""
        if self.context and self.context.is_ended:
            return self.context.get_data()
        else:
            print(
                "Warning: get_final_merged_data called before context ended or on non-ended context.",
                file=sys.stderr,
            )
            return {}


# Global logger instance
logger = Logger()

# --- Decorator (Simplified) ---


def trace():
    """Decorator to automatically manage a value collection context for a function."""

    def decorator(func: Callable[..., Any]):
        decorated_function_name = func.__name__

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            context_manager = LoggerContext(
                logger_instance=logger,
                function_name=decorated_function_name,
            )
            with context_manager:
                if iscoroutinefunction(func):
                    raise NotImplementedError(
                        "Async functions are not currently supported by the trace decorator."
                    )
                result = func(*args, **kwargs)

            return result

        return wrapper

    return decorator


def log(args: dict[str, Any] | Callable[[dict[str, Any]], dict[str, Any]]):
    """Adds a dictionary of key-value pairs to the current context's data."""
    ctx = CURRENT_CONTEXT.get()
    if ctx:
        if isinstance(args, dict):
            for key, value in args.items():
                ctx.add_data(key, value)
        elif callable(args):
            for key, value in args(ctx.get_data()).items():
                ctx.add_data(key, value)
    else:
        print(
            f"Warning: log({args}) called outside of a running context. Data will be lost.",
            file=sys.stderr,
        )


# --- Utility Function for HttpResponse ---


def embed_data_in_http_response(
    response: HttpResponse,
    # data_to_embed: Dict[str, Any],
    data_to_embed: BaseModel | Dict[str, Any],
    log_key: str = LOG_KEY,
) -> HttpResponse:
    """Embeds collected data into the JSON body of an Azure HttpResponse."""
    if response.mimetype != "application/json":
        print("Warning: Cannot embed data into non-JSON HttpResponse.", file=sys.stderr)
        return response

    try:
        body = json.loads(response.get_body())
        if not isinstance(body, dict):
            print(
                "Warning: Cannot embed data into non-dict JSON body.", file=sys.stderr
            )
            return response

        if isinstance(data_to_embed, BaseModel):
            body[log_key] = data_to_embed.model_dump(mode="json")
        else:
            body[log_key] = data_to_embed

        # Update headers to include the log key
        # Convert the list of tuples back to a dictionary (which is a Mapping)
        # Note: response.headers is already a Mapping-like object (werkzeug.Headers),
        # but the existing code converted it to a list of tuples.
        # We convert it back to a dict here to satisfy the type hint and ensure compatibility.
        headers_map = dict(response.headers)

        return HttpResponse(
            body=json.dumps(body, ensure_ascii=False, default=str),
            status_code=response.status_code,
            mimetype=response.mimetype,
            headers=headers_map,
        )
    except json.JSONDecodeError:
        print(
            "Warning: Failed to decode JSON body, cannot embed data.", file=sys.stderr
        )
    except Exception as e:
        print(f"Error embedding data into HttpResponse: {e}", file=sys.stderr)

    return response


# # --- New Decorator for Azure HTTP Functions ---


def trace_http_azure(log_key: str = "log"):
    """Decorator for Azure Functions returning HttpResponse.
    Automatically manages a value collection context and embeds the final
    merged data into the JSON body of the returned HttpResponse under
    the specified key (default: 'log').
    """

    def decorator(
        func: Callable[..., HttpResponse],
    ):  # Expects function to return HttpResponse
        decorated_function_name = func.__name__

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> HttpResponse:
            context_manager = LoggerContext(
                logger_instance=logger,
                function_name=decorated_function_name,
            )

            result: Optional[HttpResponse] = None

            # Execute the function within the managed context
            try:
                with context_manager:
                    if iscoroutinefunction(func):
                        # Async support could be added here if needed later
                        raise NotImplementedError(
                            "Async functions are not supported by trace_http_azure decorator."
                        )
                    start_time = time.time()
                    # Assume the wrapped function returns an HttpResponse
                    result = func(*args, **kwargs)
                    end_time = time.time()
                    execution_time = end_time - start_time
                    log(
                        {
                            "responseTime": execution_time,
                        }
                    )

                # Get the final merged data collected during the function execution
                collected_data = context_manager.get_final_merged_data()

                final_response = embed_data_in_http_response(
                    result, collected_data, log_key=log_key
                )
                return final_response
            except Exception:
                # エラーハンドラに例外を再raiseして処理を委譲
                # コンテキストはすでに終了しているため、ログデータの収集は行わない
                raise

        return wrapper

    return decorator


# --- Example Usage (Updated for Value Collection) ---

# @trace()
# def process_user_request(user_id: str):
#     log({"status": "processing", "user": user_id})
#     user_data = {"name": f"User_{user_id}", "email": f"user{user_id}@example.com"}
#     log({"user_data_fetched": True, "user_name": user_data["name"]})
#     processed_prefs = process_preferences(user_id, {"theme": "dark"})
#     log({"prefs_processed": True})
#     return {"status": "completed", "final_prefs": processed_prefs}

# @trace()
# def process_preferences(user_id: str, current_prefs: Dict[str, Any]) -> Dict[str, Any]:
#     log({"preference_step": "started", "current_theme": current_prefs.get("theme")})
#     updated_prefs = current_prefs.copy()
#     updated_prefs["notifications"] = "email"
#     log({"preference_step": "updated", "new_notification_setting": "email"})
#     return updated_prefs

# def run_main_flow():
#     print("--- Running main flow with LoggerContext ---")
#     main_context = LoggerContext(logger, function_name="main_flow_context")
#     final_result = None
#     with main_context:
#         log({"entrypoint": "run_main_flow", "initial_state": "ready"})
#         user_id = "123"
#         final_result = process_user_request(user_id)
#         log({"process_user_request_completed": True})

#         log({"final_status_in_main": final_result.get("status")})

#     collected_data = main_context.get_final_merged_data()
#     print("\n--- Final Merged Collected Data (main_flow_context) ---")
#     print(json.dumps(collected_data, indent=2, default=str))
#     print(f"\nFinal result from process_user_request: {final_result}")

# @trace()
# def sample_azure_function_manual_embed(req: HttpRequest) -> HttpResponse:
#     log({"handler": "sample_azure_function_manual_embed"})
#     user = req.params.get('user') or req.get_json().get('user')
#     if user:
#         log({"user_identified": user})
#         response_body = {"message": f"Processed for {user}!"}
#         http_response = HttpResponse(
#             json.dumps(response_body),
#             mimetype="application/json"
#         )
#     else:
#         log({"error": "User not found"})
#         http_response = HttpResponse(
#              json.dumps({"error": "User parameter missing"}),
#              status_code=400,
#              mimetype="application/json"
#         )

#     current_ctx = get_current_context()
#     collected_data_dict = current_ctx.get_data() if current_ctx else {}

#     final_response = embed_data_in_http_response(http_response, collected_data_dict)
#     return final_response

# # Example using the new trace_http_azure decorator
# @trace_http_azure(log_key="_request_log") # Use a custom key
# def azure_func_example(req: HttpRequest) -> HttpResponse:
#     user = req.params.get('user')
#     log({"user_param_received": user})
#     if user:
#         # Simulate calling another function
#         processed_data = process_user_data(user)
#         log({"user_data_processing_done": True})
#         return HttpResponse(
#             json.dumps({"message": f"Hello, {user}!", "processed": processed_data}),
#             mimetype="application/json"
#         )
#     else:
#         return HttpResponse(
#              json.dumps({"error": "User parameter missing"}),
#              status_code=400,
#              mimetype="application/json"
#         )

# @trace() # Use regular trace if no HTTP response embedding is needed
# def process_user_data(username: str):
#     log({"processing_user": username, "step": 1})
#     # Simulate work
#     log({"step": 2, "status": "completed"})
#     return {"uid": username, "status": "processed"}

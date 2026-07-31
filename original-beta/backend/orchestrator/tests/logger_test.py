import json
from datetime import datetime

import azure.functions as func
import pytest
from modules.logging.logger import Logger, LoggerContext, RunTree, log_operation, trace
from modules.logging.scheme import (
    ChatCompletionResponse,
    ContextInfo,
    FailureLog,
    RunLog,
    SuccessLog,
)
from openai.types.chat import ChatCompletion, ChatCompletionMessage
from openai.types.chat.chat_completion import Choice, CompletionUsage


def create_mock_chat_completion() -> ChatCompletion:
    """テスト用のモックChatCompletionを作成"""
    return ChatCompletion(
        id="test-id",
        model="gpt-3.5-turbo",
        object="chat.completion",
        created=int(datetime.now().timestamp()),
        choices=[
            Choice(
                finish_reason="stop",
                index=0,
                message=ChatCompletionMessage(
                    content="Test response", role="assistant"
                ),
            )
        ],
        usage=CompletionUsage(completion_tokens=10, prompt_tokens=20, total_tokens=30),
    )


class TestLogger:
    @pytest.fixture
    def logger(self):
        return Logger()

    def test_start_run(self, logger: Logger):
        """start_runの基本機能をテスト"""
        run = logger.start_run(
            user_id="test_user",
            llm_type="test_model",  # model_type -> llm_type
            input_value="test input",
            metadata={
                "llm_name": "gpt-3.5-turbo",
                "function_name": "test_function",
            },  # model_name -> llm_name
        )

        assert isinstance(run, RunTree)
        assert run.context_info is not None
        assert run.context_info.llm_type == "test_model"  # model_type -> llm_type
        assert run.context_info.input_value == "test input"
        assert run.context_info.llm_name == "gpt-3.5-turbo"  # model_name -> llm_name
        assert run.context_info.function_name == "test_function"

    def test_end_run_success(self, logger: Logger):
        """正常終了時のend_runをテスト"""
        run = logger.start_run(
            user_id="test_user", llm_type="test_model", input_value="test input"
        )

        chat_completion = create_mock_chat_completion()
        log = logger.end_run(run, chat_completion)

        assert isinstance(log, RunLog)
        assert isinstance(log.contextLog, SuccessLog)
        assert log.contextLog.successful is True

    def test_end_run_failure(self, logger: Logger):
        """エラー発生時のend_runをテスト"""
        run = logger.start_run(
            user_id="test_user", llm_type="test_model", input_value="test input"
        )

        error = ValueError("Test error")
        log = logger.end_run(run, None, error=error)

        assert isinstance(log, RunLog)
        assert isinstance(log.contextLog, FailureLog)
        assert log.contextLog.successful is False
        assert log.contextLog.error_log.error_message == "Test error"
        dumped = log.model_dump(exclude_none=True, exclude_unset=True)
        assert dumped is not None

    def test_nested_runs(self, logger: Logger):
        """ネストされた実行コンテキストのテスト"""
        parent_run = logger.start_run(
            user_id="test_user", llm_type="parent_model", input_value="parent input"
        )

        child_run = logger.start_run(
            user_id="test_user", llm_type="child_model", input_value="child input"
        )

        assert child_run.parent_run_id == parent_run.run_id
        assert len(parent_run.children) == 1
        assert parent_run.children[0] == child_run

    def test_trace_log_inclusion(self, logger: Logger):
        """トレースログの含有条件をテスト"""
        # ケース1: chat_historyもflow_historyもNoneの場合
        run1 = logger.start_run(
            user_id="test_user", llm_type="test_model", input_value="test input"
        )
        log1 = logger.end_run(run1, "test output")
        assert log1 is not None
        assert log1.traceLog is None  # トレースログが含まれていないことを確認

        # ケース2: chat_historyがある場合
        run2 = logger.start_run(
            user_id="test_user",
            llm_type="test_model",
            input_value="test input",
            chat_history=[{"role": "user", "content": "test"}],
        )
        log2 = logger.end_run(run2, "test output")
        assert log2 is not None
        assert log2.traceLog is not None  # トレースログが含まれていることを確認

        # ケース3: flow_historyがある場合（子ノードがある場合）
        parent_run = logger.start_run(
            user_id="test_user", llm_type="parent_model", input_value="parent input"
        )
        child_run = logger.start_run(
            user_id="test_user", llm_type="child_model", input_value="child input"
        )
        logger.end_run(child_run, "child output")
        log3 = logger.end_run(parent_run, "parent output")
        assert log3 is not None
        assert log3.traceLog is not None  # トレースログが含まれていることを確認
        assert log3.traceLog.flow_history is not None


class TestLoggerContext:
    @pytest.fixture
    def logger(self):
        return Logger()

    def test_context_manager(self, logger: Logger):
        """LoggerContextの基本機能をテスト"""
        with LoggerContext(
            logger=logger,
            user_id="test_user",
            llm_type="test_model",  # model_type -> llm_type
            input_value="test input",
            metadata={"test_key": "test_value"},
        ) as run:
            assert isinstance(run, RunTree)
            assert run.context_info is not None
            assert run.context_info.llm_type == "test_model"  # model_type -> llm_type
            assert run.context_info.input_value == "test input"

    def test_context_manager_with_error(self, logger: Logger):
        """LoggerContextでのエラーハンドリングをテスト"""
        try:
            with LoggerContext(
                logger=logger,
                user_id="test_user",
                llm_type="test_model",  # model_type -> llm_type
                input_value="test input",
            ):
                raise ValueError("Test error")
        except ValueError:
            pass

        # エラーが適切にログされたことを確認する処理を追加


class TestRunTree:
    def test_retrieve_usage_info(self):
        """retrieve_usage_infoの機能をテスト"""
        chat_completion = create_mock_chat_completion()
        usage = RunTree.retrieve_usage_info(chat_completion)

        assert usage is not None
        assert usage["prompt_tokens"] == 20
        assert usage["completion_tokens"] == 10
        assert usage["total_tokens"] == 30

    def test_add_child(self):
        """子ノードの追加機能をテスト"""
        parent = RunTree(
            context_info=ContextInfo(
                tags=[],
                input_type="text",
                output_type="text",
                input_value="",
                token_usage={
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
                llm_name="",
                llm_type="parent_function",
                function_name="parent_function",
            ),
            run_id="parent",
        )
        child = RunTree(
            context_info=ContextInfo(
                tags=[],
                input_type="text",
                output_type="text",
                input_value="",
                token_usage={
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                },
                llm_name="",
                llm_type="child_function",
                function_name="child_function",
            ),
            run_id="child",
        )

        parent.add_child(child)
        assert len(parent.children) == 1
        assert parent.children[0] == child


class TestNestedLogging:
    @pytest.fixture
    def logger(self):
        return Logger()

    def test_nested_function_logging(self, logger: Logger):
        """ネストされた関数のロギングをテスト"""

        def inner_function(parent_run: RunTree) -> str:
            with LoggerContext(
                logger=logger,
                user_id="test_user",
                llm_type="inner_model",  # model_type -> llm_type
                input_value="inner input",
                metadata={"function_name": "inner_function", "tags": ["inner"]},
            ) as child_run:
                chat_completion = create_mock_chat_completion()
                return logger.end_run(child_run, chat_completion)

        with LoggerContext(
            logger=logger,
            user_id="test_user",
            llm_type="outer_model",  # model_type -> llm_type
            input_value="outer input",
            metadata={"function_name": "outer_function"},
        ) as run:
            inner_result = inner_function(run)
            log = logger.end_run(run, inner_result)

        assert log is not None
        assert isinstance(log, RunLog)
        assert log.contextLog.llm_type == "outer_model"
        assert log.contextLog.token_usage["total_tokens"] == 30

        # トレース階層の検証
        assert log.traceLog is not None
        assert log.traceLog.flow_history is not None
        assert "inner_function" in log.traceLog.flow_history

    def test_multiple_nested_functions(self, logger: Logger):
        """複数のネストされた関数のロギングをテスト"""

        def deepest_function(run: RunTree) -> str:
            child_run = run.create_child(
                llm_type="deepest_model",  # model_type -> llm_type
                input_value="deepest input",
                tags=["deepest"],
                name="deepest_function",
            )
            chat_completion = create_mock_chat_completion()
            child_run.output(chat_completion)
            child_run.end()
            return "deepest result"

        def middle_function(run: RunTree) -> str:
            child_run = run.create_child(
                llm_type="middle_model",  # model_type -> llm_type
                input_value="middle input",
                tags=["middle"],
                name="middle_function",
            )
            result = deepest_function(child_run)
            child_run.output(result)
            child_run.end()
            return "middle result"

        with trace(
            user_id="test_user",
            llm_type="outer_model",  # model_type -> llm_type
            input_value="outer input",
            name="outer_function",
        ) as run:
            result = middle_function(run)
            run.output(result)
            log = run.end()

        assert log is not None
        # 親のコンテキストの検証
        assert isinstance(log.contextLog, SuccessLog)
        assert log.contextLog.llm_type == "outer_model"
        assert log.contextLog.output_value == "middle result"

        # トークン使用量の集計を検証（deepestのみがトークンを使用）
        assert log.contextLog.token_usage["prompt_tokens"] == 20
        assert log.contextLog.token_usage["completion_tokens"] == 10
        assert log.contextLog.token_usage["total_tokens"] == 30

        # トレース階層の検証
        assert log.traceLog is not None
        assert log.traceLog.flow_history is not None
        assert "middle_function" in log.traceLog.flow_history

        middle_log = log.traceLog.flow_history["middle_function"]
        assert middle_log.contextLog.llm_type == "middle_model"
        assert middle_log.traceLog is not None
        assert middle_log.traceLog.flow_history is not None
        assert "deepest_function" in middle_log.traceLog.flow_history

    def test_parallel_functions(self, logger: Logger):
        """並列の関数実行のロギングをテスト"""

        def parallel_function_1(run: RunTree) -> str:
            child_run = run.create_child(
                llm_type="parallel_model_1",  # model_type -> llm_type
                input_value="parallel input 1",
                tags=["parallel1"],
                name="parallel_function_1",
            )
            chat_completion = create_mock_chat_completion()
            child_run.output(chat_completion)
            child_run.end()
            return "parallel result 1"

        def parallel_function_2(run: RunTree) -> str:
            child_run = run.create_child(
                llm_type="parallel_model_2",  # model_type -> llm_type
                input_value="parallel input 2",
                tags=["parallel2"],
                name="parallel_function_2",
            )
            chat_completion = create_mock_chat_completion()
            child_run.output(chat_completion)
            child_run.end()
            return "parallel result 2"

        with trace(
            user_id="test_user",
            llm_type="parent_model",  # model_type -> llm_type
            input_value="parent input",
            name="parent_function",
        ) as run:
            result1 = parallel_function_1(run)
            result2 = parallel_function_2(run)
            run.output([result1, result2])
            log = run.end()

        assert log is not None
        # 親のコンテキストの検証
        assert isinstance(log.contextLog, SuccessLog)
        assert log.contextLog.llm_type == "parent_model"
        assert log.contextLog.output_value == ["parallel result 1", "parallel result 2"]

        # トークン使用量の集計を検証（2つの並列関数からの合計）
        assert log.contextLog.token_usage["prompt_tokens"] == 40  # 20 * 2
        assert log.contextLog.token_usage["completion_tokens"] == 20  # 10 * 2
        assert log.contextLog.token_usage["total_tokens"] == 60  # 30 * 2

        # 並列トレースの検証
        assert log.traceLog is not None
        assert log.traceLog.flow_history is not None
        assert "parallel_function_1" in log.traceLog.flow_history
        assert "parallel_function_2" in log.traceLog.flow_history

    def test_parallel_functions_with_trace(self, logger: Logger):
        """トレースを使用した並列関数実行のテスト"""

        def parallel_function_1() -> str:
            with trace(
                user_id="test_user",
                llm_type="parallel_model_1",
                input_value="parallel input 1",
                name="parallel_function_1",
            ) as run:
                chat_completion = create_mock_chat_completion()
                run.output(chat_completion)
                return "parallel result 1"

        def parallel_function_2() -> str:
            with trace(
                user_id="test_user",
                llm_type="parallel_model_2",
                input_value="parallel input 2",
                name="parallel_function_2",
            ) as rt:
                chat_completion = create_mock_chat_completion()
                rt.output(chat_completion)
                return "parallel result 2"

        with trace(
            user_id="test_user",
            llm_type="parent_model",
            input_value="parent input",
            name="parent_function",
        ) as run:
            result1 = parallel_function_1()
            result2 = parallel_function_2()
            run.output([result1, result2])
            log = run.end()

        assert log is not None
        # 親のコンテキストの検証
        assert isinstance(log.contextLog, SuccessLog)
        assert log.contextLog.llm_type == "parent_model"
        assert log.contextLog.output_value == ["parallel result 1", "parallel result 2"]

        # トレース階層の検証
        assert log.traceLog is not None
        assert log.traceLog.flow_history is not None
        assert "parallel_function_1" in log.traceLog.flow_history
        assert "parallel_function_2" in log.traceLog.flow_history

        # 並列関数のトレースを個別に検証
        parallel1_log = log.traceLog.flow_history["parallel_function_1"]
        assert parallel1_log.contextLog.llm_type == "parallel_model_1"
        assert parallel1_log.contextLog.successful is True
        assert isinstance(parallel1_log.contextLog.output_value, ChatCompletionResponse)

        parallel2_log = log.traceLog.flow_history["parallel_function_2"]
        assert parallel2_log.contextLog.llm_type == "parallel_model_2"
        assert parallel2_log.contextLog.successful is True
        assert isinstance(parallel2_log.contextLog.output_value, ChatCompletionResponse)

        # トークン使用量の集計を検証（2つの並列関数からの合計）
        assert log.contextLog.token_usage["prompt_tokens"] == 40  # 20 * 2
        assert log.contextLog.token_usage["completion_tokens"] == 20  # 10 * 2
        assert log.contextLog.token_usage["total_tokens"] == 60  # 30 * 2


def test_logger_http_response():
    """HTTPResponseを返す関数のロギングをテスト"""

    @log_operation(
        llm_type="test_model",  # model_type -> llm_type
        input_value="test input",
        name="test_http_function",
        metadata={"tags": ["http_test"]},
    )
    def test_http_function(req_body: dict[str, str]) -> func.HttpResponse:
        # Azure Functionsの処理をシミュレート
        chat_completion = create_mock_chat_completion()
        response_data = {
            "answer": chat_completion.choices[0].message.content,
            "chatHistory": [
                {"role": "user", "content": "test question"},
                {"role": "assistant", "content": "test response"},
            ],
        }
        return func.HttpResponse(
            body=json.dumps(response_data), status_code=200, mimetype="application/json"
        )

    # テスト実行
    response = test_http_function({"question": "test"})

    # レスポンスの検証
    assert isinstance(response, func.HttpResponse)
    assert response.status_code == 200
    assert response.mimetype == "application/json"

    # レスポンスボディの検証
    response_body = json.loads(response.get_body())
    assert "answer" in response_body
    assert "chatHistory" in response_body
    assert "log" in response_body  # ログが含まれていることを確認

    # ログの内容を検証
    log_data = response_body["log"]
    assert "contextLog" in log_data
    assert "traceLog" not in log_data

    # コンテキストログの検証
    context_log = log_data["contextLog"]
    assert context_log["llm_type"] == "test_model"
    assert context_log["successful"] is True
    assert context_log["function_name"] == "test_http_function"

    # トークン使用量の検証
    assert context_log["token_usage"]["prompt_tokens"] == 0
    assert context_log["token_usage"]["completion_tokens"] == 0
    assert context_log["token_usage"]["total_tokens"] == 0


def test_logger_http_response_with_nested_calls():
    """ネストされた呼び出しを含むHTTPResponseのテスト"""

    def inner_function(run: RunTree) -> ChatCompletion:
        # traceコンテキストを削除し、直接create_childを使用
        child_run = run.create_child(
            llm_type="inner_model",  # model_type -> llm_type
            input_value="inner input",
            tags=["inner"],
            name="inner_function",
        )
        chat_completion = create_mock_chat_completion()
        child_run.output(chat_completion)
        child_run.end()
        return chat_completion

    @log_operation(
        llm_type="test_model",  # model_type -> llm_type
        input_value="test input",
        name="test_nested_http_function",
        metadata={"tags": ["http_test", "nested"]},
    )
    def test_nested_http_function(req_body: dict[str, str]) -> func.HttpResponse:
        # 単一のtraceコンテキストのみを使用
        with trace(
            user_id="test_user",
            llm_type="inner_model",  # model_type -> llm_type
            input_value="inner input",
            name="inner_trace",
        ) as run:
            chat_completion = inner_function(run)
            response_data = {
                "answer": chat_completion.choices[0].message.content,
                "chatHistory": [
                    {"role": "user", "content": "test question"},
                    {"role": "assistant", "content": "test response"},
                ],
            }
            return func.HttpResponse(
                body=json.dumps(response_data),
                status_code=200,
                mimetype="application/json",
            )

    # テスト実行と検証
    response = test_nested_http_function({"question": "test"})
    response_body = json.loads(response.get_body())
    log_data = response_body["log"]

    # 階層構造の検証を修正
    assert log_data["traceLog"] is not None
    assert log_data["traceLog"]["flow_history"] is not None
    assert "inner_trace" in log_data["traceLog"]["flow_history"]

    # inner_traceの子トレースを検証
    inner_trace = log_data["traceLog"]["flow_history"]["inner_trace"]
    assert inner_trace["traceLog"] is not None
    assert inner_trace["traceLog"]["flow_history"] is not None
    assert "inner_function" in inner_trace["traceLog"]["flow_history"]


class TestContextInfo:
    @pytest.fixture
    def context_info(self) -> ContextInfo:
        """基本的なContextInfoを作成"""
        return ContextInfo(
            tags=["test"],
            input_type="text",
            output_type="text",
            input_value="test input",
            token_usage={
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30,
            },
            llm_name="test-model",  # model_name -> llm_name
            llm_type="test",  # model_type -> llm_type
            function_name="test_function",
        )

    def test_as_success(self, context_info: ContextInfo):
        """as_successメソッドのテスト"""
        output = "test output"
        delay_time = 0.5
        token_usage = {"prompt_tokens": 15, "completion_tokens": 25, "total_tokens": 40}

        success_log = context_info.as_success(
            output=output, delay_time=delay_time, token_usage=token_usage
        )

        # 基本的な属性の検証
        assert isinstance(success_log, SuccessLog)
        assert success_log.successful is True
        assert success_log.output_value == output
        assert success_log.delay_time == delay_time

        # 継承された属性の検証
        assert success_log.tags == context_info.tags
        assert success_log.input_type == context_info.input_type
        assert success_log.output_type == context_info.output_type
        assert success_log.input_value == context_info.input_value
        assert success_log.llm_name == context_info.llm_name
        assert success_log.llm_type == context_info.llm_type
        assert success_log.function_name == context_info.function_name

        # token_usageの検証
        assert success_log.token_usage == token_usage

        # token_usage未指定時のテスト
        default_success_log = context_info.as_success(
            output=output, delay_time=delay_time
        )
        assert default_success_log.token_usage == context_info.token_usage

    def test_as_failure(self, context_info: ContextInfo):
        """as_failureメソッドのテスト"""
        delay_time = 0.5
        error = ValueError("test error")
        token_usage = {"prompt_tokens": 15, "completion_tokens": 25, "total_tokens": 40}

        failure_log = context_info.as_failure(
            delay_time=delay_time, error=error, token_usage=token_usage
        )

        # 基本的な属性の検証
        assert isinstance(failure_log, FailureLog)
        assert failure_log.successful is False
        assert failure_log.delay_time == delay_time

        # エラー情報の検証
        assert failure_log.error_log.error_from == "ValueError"
        assert failure_log.error_log.error_message == "test error"
        assert failure_log.error_log.stack_trace is not None

        # 継承された属性の検証
        assert failure_log.tags == context_info.tags
        assert failure_log.input_type == context_info.input_type
        assert failure_log.output_type == context_info.output_type
        assert failure_log.input_value == context_info.input_value
        assert failure_log.llm_name == context_info.llm_name
        assert failure_log.llm_type == context_info.llm_type
        assert failure_log.function_name == context_info.function_name

        # token_usageの検証
        assert failure_log.token_usage == token_usage

        # token_usage未指定時のテスト
        default_failure_log = context_info.as_failure(
            delay_time=delay_time, error=error
        )
        assert default_failure_log.token_usage == context_info.token_usage

    def test_serialization(self, context_info: ContextInfo):
        """シリアライゼーションのテスト"""
        # 成功ログのシリアライゼーション
        success_log = context_info.as_success(output="test output", delay_time=0.5)
        success_dict = success_log.model_dump()
        assert isinstance(success_dict, dict)
        assert "successful" in success_dict
        assert "output_value" in success_dict
        assert "token_usage" in success_dict

        # 失敗ログのシリアライゼーション
        failure_log = context_info.as_failure(
            delay_time=0.5, error=ValueError("test error")
        )
        failure_dict = failure_log.model_dump()
        assert isinstance(failure_dict, dict)
        assert "successful" in failure_dict
        assert "error_log" in failure_dict
        assert "token_usage" in failure_dict

        # JSONシリアライゼーション
        success_json = success_log.model_dump_json()
        assert isinstance(success_json, str)
        success_loaded = json.loads(success_json)
        assert success_loaded["successful"] is True

        failure_json = failure_log.model_dump_json()
        assert isinstance(failure_json, str)
        failure_loaded = json.loads(failure_json)
        assert failure_loaded["successful"] is False

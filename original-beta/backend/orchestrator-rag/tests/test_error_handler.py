from typing import Callable
import json
from unittest.mock import Mock, patch

import azure.functions as func
import pytest
from openai._exceptions import APIError, BadRequestError, OpenAIError, RateLimitError
from httpx import Response, Request

from modules.error_handler import error_handler


# テスト用のダミー関数
def create_dummy_func(exception: Exception | None = None) -> Callable[[func.HttpRequest], func.HttpResponse]:
    @error_handler
    def dummy_func(req: func.HttpRequest) -> func.HttpResponse:
        if exception:
            raise exception
        return func.HttpResponse("Success", status_code=200)
    return dummy_func


def test_successful_response():
    """正常系のテスト"""
    # テスト用のリクエストモックを作成
    mock_req = Mock(spec=func.HttpRequest)
    
    # エラーを発生させないダミー関数を作成
    dummy_func = create_dummy_func()
    
    # 関数を実行
    response = dummy_func(mock_req)
    
    # アサーション
    assert response.status_code == 200
    assert response.get_body().decode() == "Success"


def create_mock_response(status_code: int) -> Response:
    """モックレスポンスを作成するヘルパー関数"""
    mock_request = Request("GET", "https://api.openai.com/v1/test")
    return Response(status_code, request=mock_request)


@pytest.mark.parametrize("exception,expected_status,expected_message", [
    (RateLimitError(
            message="Rate limit exceeded",
            response=create_mock_response(429),
            body={"error": {"message": "Rate limit exceeded"}}
        ), 
        429, 
        "APIレート制限に達しました。しばらく待ってから再試行してください"),
    (APIError(
        message="API error occurred",
        request=Request("GET", "https://api.openai.com/v1/test"),
        body={"error": {"message": "API error occurred"}}
        ), 
        503, 
        "API呼び出し中にエラーが発生しました"),
    (BadRequestError(
        message="Bad request",
        response=create_mock_response(400),
        body={
            'message': "The response was filtered due to the prompt triggering Azure OpenAI's content management policy. Please modify your prompt and retry. To learn more about our content filtering policies please read our documentation: https://go.microsoft.com/fwlink/?linkid=2198766", 
            'type': None, 
            'param': 'prompt', 
            'code': 'content_filter', 
            'status': 400}
    ), 400, "コンテンツフィルターによってリクエストが拒否されました"),
    (OpenAIError(), 503, "OpenAI APIでエラーが発生しました"),
])
def test_error_handling(exception: Exception, expected_status: int, expected_message: str):
    """各種エラーケースのテスト"""
    # テスト用のリクエストモックを作成
    mock_req = Mock(spec=func.HttpRequest)
    
    # エラーを発生させるダミー関数を作成
    dummy_func = create_dummy_func(exception)
    
    # 関数を実行
    response = dummy_func(mock_req)
    
    # レスポンスボディをパース
    response_body = json.loads(response.get_body().decode())
    
    # アサーション
    assert response.status_code == expected_status
    assert response_body["error"] == expected_message
    assert "log_details" in response_body
    assert "timestamp" in response_body["log_details"]
    assert "error_type" in response_body["log_details"]
    assert "tags" in response_body["log_details"]


@patch('logging.error')
def test_logging_called(mock_logging: Mock):
    """ロギングが正しく呼び出されることを確認するテスト"""
    # テスト用のリクエストモックを作成
    mock_req = Mock(spec=func.HttpRequest)
    
    # エラーを発生させるダミー関数を作成
    dummy_func = create_dummy_func(APIError(
        message="API error occurred",
        request=Request("GET", "https://api.openai.com/v1/test"),
        body={"error": {"message": "API error occurred"}}
    ))
    
    # 関数を実行
    dummy_func(mock_req)
    
    # ロギングが呼び出されたことを確認
    assert mock_logging.called


@pytest.mark.parametrize("error_code,expected_message", [
    (
        "content_filter",
        "コンテンツフィルターによってリクエストが拒否されました"
    ),
    (
        "length",
        "リクエストが長さの制限によって拒否されました"
    ),
])
def test_bad_request_error_with_code(error_code: str, expected_message: str):
    """BadRequestErrorの特定のエラーコードに対するテスト"""
    mock_req = Mock(spec=func.HttpRequest)
    
    # エラーオブジェクトを作成
    error = BadRequestError(
        message="Bad request",
        response=create_mock_response(400),
        body={"error": {"message": "Bad request", "code": error_code}}
    )
    # codeプロパティを設定
    error.code = error_code
    
    dummy_func = create_dummy_func(error)
    
    # 関数を実行
    response = dummy_func(mock_req)
    
    # レスポンスボディをパース
    response_body = json.loads(response.get_body().decode())
    
    # アサーション
    assert response.status_code == 400
    assert response_body["error"] == expected_message
    assert "log_details" in response_body
    assert "timestamp" in response_body["log_details"]
    assert "error_type" in response_body["log_details"]
    assert "tags" in response_body["log_details"]


def test_bad_request_error_without_code():
    """BadRequestErrorのコードなしの場合のテスト"""
    mock_req = Mock(spec=func.HttpRequest)
    dummy_func = create_dummy_func(BadRequestError(
        message="Bad request",
        response=create_mock_response(400),
        body={"error": {"message": "Bad request"}}
    ))
    
    # BadRequestErrorが再送出されることを確認
    with pytest.raises(BadRequestError):
        dummy_func(mock_req)


def test_value_error_raises():
    """ValueErrorが適切に再送出されることを確認するテスト"""
    mock_req = Mock(spec=func.HttpRequest)
    dummy_func = create_dummy_func(ValueError("テストエラー"))
    
    # ValueErrorが再送出されることを確認
    with pytest.raises(ValueError, match="テストエラー"):
        dummy_func(mock_req) 
        
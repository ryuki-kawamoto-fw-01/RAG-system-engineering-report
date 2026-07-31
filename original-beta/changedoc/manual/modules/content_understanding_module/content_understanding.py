"""Azure Content Understanding client wrappers."""

# https://github.com/Azure-Samples/azure-ai-content-understanding-python/blob/main/python/content_understanding_client.pyを参考に実装

from __future__ import annotations

import json
import logging
import os
import time
from logging import getLogger
from pathlib import Path
from typing import Any, Callable
import traceback

import requests  # type: ignore[import]
from azure.core.exceptions import ResourceNotFoundError
from requests import Response

from modules.llm_module.models import Settings
from modules.manual_models import ContentUnderstandingResponse
from modules.utils.blob_utils import download_file_from_blob, upload_content_to_blob
from modules.utils.managed_identity import get_managed_identity_token

logger = getLogger(__name__)


class AzureContentUnderstandingClient:
    # 上記githubを参照に作成しているため、テスト未実施
    def __init__(
        self,
        endpoint: str,
        api_version: str,
        subscription_key: str | None = None,
        token_provider: Callable[[], str] | None = None,
        x_ms_useragent: str = "cu-sample-code",
    ) -> None:
        """
        Initializes the AzureContentUnderstandingClient.

        Args:
            endpoint (str): The endpoint of the service.
            api_version (str): The API version to use.
            subscription_key (str, optional): The subscription key for the content understanding service. Defaults to None.
            token_provider (Callable[[], str], optional): A callable that returns an API token for the service. Defaults to None.
            x_ms_useragent (str, optional): The user agent to use for the service. Defaults to "cu-sample-code".

        Raises:
            ValueError: If neither subscription key nor token provider is provided.
            ValueError: If API version is not provided.
        """
        if not subscription_key and token_provider is None:
            raise ValueError(
                "Either subscription key or token provider must be provided"
            )
        if not api_version:
            raise ValueError("API version must be provided")
        if not endpoint:
            raise ValueError("Endpoint must be provided")

        self._endpoint: str = endpoint.rstrip("/")
        self._api_version: str = api_version
        self._logger: logging.Logger = logging.getLogger(__name__)
        self._logger.setLevel(logging.INFO)

        token = token_provider() if token_provider else None

        self._headers: dict[str, str] = self._get_headers(
            subscription_key, token, x_ms_useragent
        )

    @staticmethod
    def _get_analyze_url(endpoint: str, api_version: str, analyzer_id: str) -> str:
        return f"{endpoint}/contentunderstanding/analyzers/{analyzer_id}:analyze?api-version={api_version}"

    def _get_analyzer_url(
        self, endpoint: str, api_version: str, analyzer_id: str
    ) -> str:
        return f"{endpoint}/contentunderstanding/analyzers/{analyzer_id}?api-version={api_version}"  # noqa

    def _get_analyzer_list_url(self, endpoint: str, api_version: str) -> str:
        return f"{endpoint}/contentunderstanding/analyzers?api-version={api_version}"

    @staticmethod
    def _get_image_retrieval_url(
        endpoint: str, api_version: str, operation_id: str, image_id: str
    ) -> str:
        return f"{endpoint}/contentunderstanding/analyzerResults/{operation_id}/files/{image_id}?api-version={api_version}"

    def _get_headers(
        self, subscription_key: str | None, api_token: str | None, x_ms_useragent: str
    ) -> dict[str, str]:
        """Returns the headers for the HTTP requests.

        Args:
            subscription_key (str): The subscription key for the service.
            api_token (str): The API token for the service.
            enable_face_identification (bool): A flag to enable face identification.

        Returns:
            dict: A dictionary containing the headers for the HTTP requests.
        """
        headers = (
            {"Ocp-Apim-Subscription-Key": subscription_key}
            if subscription_key
            else {"Authorization": f"Bearer {api_token}"}
        )
        headers["x-ms-useragent"] = x_ms_useragent
        return headers

    def get_analyzer_detail_by_id(self, analyzer_id: str) -> dict[str, Any]:
        """
        Retrieves a specific analyzer detail through analyzerid from the content understanding service.
        This method sends a GET request to the service endpoint to get the analyzer detail.

        Args:
            analyzer_id (str): The unique identifier for the analyzer.

        Returns:
            dict: A dictionary containing the JSON response from the service, which includes the target analyzer detail.

        Raises:
            HTTPError: If the request fails.
        """
        start_ts = time.time()
        url = self._get_analyzer_url(self._endpoint, self._api_version, analyzer_id)
        response = requests.get(url=url, headers=self._headers)
        response.raise_for_status()
        payload = response.json()
        self._logger.info(
            json.dumps(
                {
                    "event": "cu.get_analyzer",
                    "analyzer_id": analyzer_id,
                    "elapsed_ms": int((time.time() - start_ts) * 1000),
                },
                ensure_ascii=False,
            )
        )
        return payload

    def get_all_analyzers(self) -> dict[str, Any]:
        """
        Retrieves a list of all available analyzers from the content understanding service.

        This method sends a GET request to the service endpoint to fetch the list of analyzers.
        It raises an HTTPError if the request fails.

        Returns:
            dict: A dictionary containing the JSON response from the service, which includes
                  the list of available analyzers.

        Raises:
            requests.exceptions.HTTPError: If the HTTP request returned an unsuccessful status code.
        """
        start_ts = time.time()
        url = self._get_analyzer_list_url(self._endpoint, self._api_version)
        response = requests.get(url=url, headers=self._headers)
        response.raise_for_status()
        payload = response.json()
        self._logger.info(
            json.dumps(
                {
                    "event": "cu.list_analyzers",
                    "count": len(payload.get("value", [])),
                    "elapsed_ms": int((time.time() - start_ts) * 1000),
                },
                ensure_ascii=False,
            )
        )
        return payload

    def begin_create_analyzer(
        self,
        analyzer_id: str,
        analyzer_template: dict | None = None,
        analyzer_template_path: str = "",
    ) -> Response:
        """
        Initiates the creation of an analyzer with the given ID and schema.

        Args:
            analyzer_id (str): The unique identifier for the analyzer.
            analyzer_template (dict, optional): The schema definition for the analyzer. Defaults to None.
            analyzer_template_path (str, optional): The file path to the analyzer schema JSON file. Defaults to "".

        Raises:
            ValueError: If neither `analyzer_template` nor `analyzer_template_path` is provided.
            requests.exceptions.HTTPError: If the HTTP request to create the analyzer fails.

        Returns:
            requests.Response: The response object from the HTTP request.
        """
        if analyzer_template_path and Path(analyzer_template_path).exists():
            with open(analyzer_template_path, "r") as file:
                analyzer_template = json.load(file)

        if not analyzer_template:
            raise ValueError("Analyzer schema must be provided.")

        headers = {"Content-Type": "application/json"}
        headers.update(self._headers)

        start_ts = time.time()
        url = self._get_analyzer_url(self._endpoint, self._api_version, analyzer_id)
        response = requests.put(url=url, headers=headers, json=analyzer_template)
        response.raise_for_status()
        self._logger.info(
            json.dumps(
                {
                    "event": "cu.create_analyzer.accepted",
                    "analyzer_id": analyzer_id,
                    "elapsed_ms": int((time.time() - start_ts) * 1000),
                },
                ensure_ascii=False,
            )
        )
        return response

    def begin_analyze(self, analyzer_id: str, file_location: bytes | str) -> Response:
        """
        Begins the analysis of a file or URL using the specified analyzer.

        Args:
            analyzer_id (str): The ID of the analyzer to use.
            file_location (bytes | str): The local path to the file or the URL to analyze.

        Returns:
            Response: The response from the analysis request.

        Raises:
            ValueError: If the file location is not a valid path or URL.
            HTTPError: If the HTTP request returned an unsuccessful status code.
        """
        data: bytes | dict[str, str]
        headers: dict[str, str]
        data: bytes = file_location
        headers = {"Content-Type": "application/octet-stream"}

        headers.update(self._headers)
        start_ts = time.time()
        analyze_url = self._get_analyze_url(
            self._endpoint, self._api_version, analyzer_id
        )
        if isinstance(data, dict):
            response = requests.post(url=analyze_url, headers=headers, json=data)
        else:
            response = requests.post(url=analyze_url, headers=headers, data=data)
        response.raise_for_status()
        self._logger.info(
            json.dumps(
                {
                    "event": "cu.begin_analyze.accepted",
                    "analyzer_id": analyzer_id,
                    "elapsed_ms": int((time.time() - start_ts) * 1000),
                },
                ensure_ascii=False,
            )
        )
        return response

    def poll_result(
        self,
        response: Response,
        timeout_seconds: int = 120,
        polling_interval_seconds: int = 2,
    ) -> dict[str, Any]:
        """
        Polls the result of an asynchronous operation until it completes or times out.

        Args:
            response (Response): The initial response object containing the operation location.
            timeout_seconds (int, optional): The maximum number of seconds to wait for the operation to complete. Defaults to 120.
            polling_interval_seconds (int, optional): The number of seconds to wait between polling attempts. Defaults to 2.

        Returns:
            dict: The JSON response of the completed operation if it succeeds.

        Raises:
            ValueError: If the operation location is not found in the response headers.
            TimeoutError: If the operation does not complete within the specified timeout.
            RuntimeError: If the operation fails.
        """
        operation_location = response.headers.get("operation-location", "")
        if not operation_location:
            raise ValueError("Operation location not found in response headers.")

        self._logger.info(
            json.dumps(
                {
                    "event": "cu.poll.start",
                    "operation_location": operation_location,
                    "timeout_seconds": timeout_seconds,
                    "polling_interval_seconds": polling_interval_seconds,
                    "initial_response_status": response.status_code,
                },
                ensure_ascii=False,
            )
        )

        start_time = time.time()
        poll_count = 0
        while True:
            elapsed_time = time.time() - start_time
            poll_count += 1

            if elapsed_time > timeout_seconds:
                raise TimeoutError(
                    f"Operation timed out after {timeout_seconds:.2f} seconds."
                )

            poll_resp = requests.get(operation_location, headers=self._headers)
            poll_resp.raise_for_status()
            poll_data = poll_resp.json()
            status = poll_data.get("status", "").lower()

            # 初回のポーリングでは詳細情報も出力
            log_data = {
                "event": "cu.poll.status",
                "status": status,
                "poll_count": poll_count,
                "elapsed_sec": round(elapsed_time, 2),
            }
            if poll_count == 1:
                log_data["first_poll_detail"] = {
                    "operation_id": poll_data.get("id", ""),
                    "created_datetime": poll_data.get("createdDateTime", ""),
                    "last_updated_datetime": poll_data.get("lastUpdatedDateTime", ""),
                    "analyzer_id": poll_data.get("result", {}).get("analyzerId", ""),
                }
                self._logger.info("=" * 80)
                self._logger.info("📊 FIRST POLLING RESULT 📊")
                self._logger.info(json.dumps(log_data, ensure_ascii=False))
                self._logger.info("=" * 80)
            else:
                self._logger.info(json.dumps(log_data, ensure_ascii=False))

            if status == "succeeded":
                self._logger.info(
                    json.dumps(
                        {
                            "event": "cu.analyze.completed",
                            "elapsed_sec": round(elapsed_time, 2),
                            "poll_count": poll_count,
                        },
                        ensure_ascii=False,
                    )
                )
                return poll_resp.json()
            if status == "failed":
                reason_payload = poll_resp.json()
                self._logger.error(
                    json.dumps(
                        {"event": "cu.analyze.failed", "reason": reason_payload},
                        ensure_ascii=False,
                    )
                )
                raise RuntimeError(
                    json.dumps(
                        {
                            "cu_error": reason_payload.get("error", {}),
                            "operation_id": reason_payload.get("id"),
                            "analyzer_id": reason_payload.get("result", {}).get(
                                "analyzerId"
                            ),
                            "status": reason_payload.get("status"),
                        },
                        ensure_ascii=False,
                    )
                )
            time.sleep(polling_interval_seconds)
            if elapsed_time > timeout_seconds:
                raise TimeoutError(
                    f"Operation timed out after {timeout_seconds:.2f} seconds."
                )

            poll_resp = requests.get(operation_location, headers=self._headers)
            poll_resp.raise_for_status()
            status = poll_resp.json().get("status").lower()
            if status == "succeeded":
                self._logger.info(
                    json.dumps(
                        {
                            "event": "cu.analyze.completed",
                            "elapsed_sec": round(elapsed_time, 2),
                        },
                        ensure_ascii=False,
                    )
                )
                return poll_resp.json()
            if status == "failed":
                self._logger.error(
                    json.dumps(
                        {"event": "cu.analyze.failed", "reason": poll_resp.json()},
                        ensure_ascii=False,
                    )
                )
                raise RuntimeError("Request failed.")
            time.sleep(polling_interval_seconds)

    def get_image_from_analyze_operation(
        self, operation_id: str, image_id: str
    ) -> bytes | None:
        """Retrieves an image from the analyze operation using the image ID.

        Args:
            operation_id (str): The ID of the analyze operation.
            image_id (str): The ID of the image to retrieve.

        Returns:
            bytes: The image content as a byte string.
        """
        image_retrieval_url = self._get_image_retrieval_url(
            self._endpoint, self._api_version, operation_id, image_id
        )
        start_ts = time.time()
        try:
            response = requests.get(url=image_retrieval_url, headers=self._headers)
            response.raise_for_status()
            assert response.headers.get("Content-Type") == "image/jpeg"
            self._logger.info(
                json.dumps(
                    {
                        "event": "cu.image.retrieved",
                        "operation_id": operation_id,
                        "image_id": image_id,
                        "elapsed_ms": int((time.time() - start_ts) * 1000),
                    },
                    ensure_ascii=False,
                )
            )
            return response.content
        except requests.exceptions.RequestException as e:
            self._logger.error(
                json.dumps(
                    {
                        "event": "cu.image.error",
                        "operation_id": operation_id,
                        "image_id": image_id,
                        "error": str(e),
                    },
                    ensure_ascii=False,
                )
            )
            return None


def create_content_understanding_client() -> (
    tuple[AzureContentUnderstandingClient, Settings]
):
    """
    Creates an instance of AzureContentUnderstandingClient and Settings.

    Returns:
        tuple: A tuple containing the AzureContentUnderstandingClient instance and Settings instance.
    """
    endpoint = os.environ.get("AZURE_CONTENT_UNDERSTANDING_ENDPOINT")
    api_version = os.environ.get("AZURE_CONTENT_UNDERSTANDING_API_VERSION")
    analyzer_id = os.environ.get("AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID")

    if endpoint is None or api_version is None or analyzer_id is None:
        raise ValueError(
            "Content Understanding environment variables are not fully set"
        )

    subscription_key = os.environ.get("AZURE_CONTENT_UNDERSTANDING_SUBSCRIPTION_KEY")
    aad_token: str | None = None
    if not subscription_key:
        # Managed Identity トークン取得 (Cognitive Services 共通スコープ)
        aad_token = get_managed_identity_token()

    settings = Settings(
        endpoint=endpoint,
        api_version=api_version,
        subscription_key=subscription_key,
        aad_token=aad_token,
        analyzer_id=analyzer_id,
    )
    client = AzureContentUnderstandingClient(
        settings.endpoint,
        settings.api_version,
        subscription_key=settings.subscription_key,
        token_provider=settings.token_provider,
    )
    return client, settings


def run_content_understanding(
    client: AzureContentUnderstandingClient, settings: Settings, file_location: bytes
) -> ContentUnderstandingResponse:
    """
    Runs the content understanding process.

    Args:
        client (AzureContentUnderstandingClient): The AzureContentUnderstandingClient instance.
        settings (Settings): The Settings instance.
        file_location (bytes): The location of the file to analyze.

    Returns:
        ContentUnderstandingResponse: The Pydantic model of the completed operation response.
    """
    response = client.begin_analyze(settings.analyzer_id, file_location)
    result_dict = client.poll_result(
        response, timeout_seconds=60 * 60, polling_interval_seconds=1
    )
    result = ContentUnderstandingResponse(**result_dict)
    logger.info(
        json.dumps(
            {
                "event": "cu.run.completed",
                "status": result.status,
                "has_contents": bool(result.result.contents),
                "operation_id": result.id,
            },
            ensure_ascii=False,
        )
    )
    return result


def get_content_understanding_result(
    client: AzureContentUnderstandingClient,
    url: bytes | str,
    container_name: str,
    result_file_blob_name: str,
    result_file_output_dir: str,
) -> ContentUnderstandingResponse:
    """
    Gets the content understanding result from Azure Blob Storage if it exists,
    otherwise runs the content understanding process and uploads the result to Blob Storage.

    Args:
        url (bytes | str): The URL of the file to analyze.
        container_name (str): The name of the blob container.
        result_file_blob_name (str): The name of the blob (file) to download/upload the result.
        result_file_output_dir (str): The local directory to save the downloaded result file.

    Returns:
        tuple: A tuple containing the AzureContentUnderstandingClient instance and the ContentUnderstandingResponse.
    """
    logging.info(
        json.dumps(
            {"event": "cu.get_result.start", "output_dir": result_file_output_dir},
            ensure_ascii=False,
        )
    )

    try:
        # 既存結果ダウンロード試行
        result_file_path = download_file_from_blob(
            container_name, result_file_blob_name, result_file_output_dir
        )
        with open(result_file_path, "r", encoding="utf-8") as f:
            result_dict: dict[str, Any] = json.load(f)
        # Pydantic モデルに変換
        result = ContentUnderstandingResponse(**result_dict)
        logging.info(
            json.dumps(
                {
                    "event": "cu.get_result.cached",
                    "blob_name": result_file_blob_name,
                    "operation_id": result.id,
                },
                ensure_ascii=False,
            )
        )
        return result
    except ResourceNotFoundError:
        logging.info(
            json.dumps(
                {"event": "cu.get_result.miss", "blob_name": result_file_blob_name},
                ensure_ascii=False,
            )
        )
        # 新規分析実行
        client, settings = create_content_understanding_client()
        analyzer_result = client.get_all_analyzers()
        analyzer_ids = [
            analyzer["analyzerId"] for analyzer in analyzer_result.get("value", [])
        ]
        logger.info(
            json.dumps(
                {
                    "event": "cu.analyzers.fetched",
                    "count": len(analyzer_ids),
                    "analyzer_ids": analyzer_ids,
                    "target_analyzer_id": settings.analyzer_id,
                    "analyzer_exists": settings.analyzer_id in analyzer_ids,
                },
                ensure_ascii=False,
            )
        )

        if settings.analyzer_id not in analyzer_ids:
            client.begin_create_analyzer(
                analyzer_id=settings.analyzer_id,
                analyzer_template_path=str(
                    Path(Path(__file__).parent, "analyzer_schema.json")
                ),
            )
            logging.info(
                json.dumps(
                    {
                        "event": "cu.analyzer.created",
                        "analyzer_id": settings.analyzer_id,
                    },
                    ensure_ascii=False,
                )
            )

        logging.info(
            json.dumps(
                {
                    "event": "cu.analyze.start",
                    "analyzer_id": settings.analyzer_id,
                    "file_size_bytes": len(url) if isinstance(url, bytes) else "N/A",
                },
                ensure_ascii=False,
            )
        )
        result = run_content_understanding(
            client=client, settings=settings, file_location=url
        )
        # Pydantic モデルを JSON に変換してアップロード
        upload_content_to_blob(
            result.model_dump_json(indent=2, by_alias=True),
            container_name,
            result_file_blob_name,
        )
        logging.info(
            json.dumps(
                {
                    "event": "cu.get_result.generated",
                    "blob_name": result_file_blob_name,
                },
                ensure_ascii=False,
            )
        )
        return result
    except Exception as e:
        logger.error(
            json.dumps(
                {
                    "event": "cu.get_result.error",
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc(),
                },
                ensure_ascii=False,
            )
        )
        raise


def get_content_understanding_images(
    keyframe: str,
    operationId: str,
    client: AzureContentUnderstandingClient,
    container_name: str,
    image_file_blob_name: str,
    image_file_output_dir: str,
) -> str:
    """Retrieve a keyframe image either from Blob Storage (if cached) or from the Content Understanding service.

    If the image is not already in Blob Storage, it is fetched from the service, uploaded
    to Blob Storage, and also written locally.

    Args:
        keyframe (str): The keyframe filename (e.g., "keyFrame.0.jpg").
        operationId (str): The operation ID from the Content Understanding analysis result.
        client (AzureContentUnderstandingClient): The Content Understanding client instance.
        container_name (str): The name of the blob container.
        image_file_blob_name (str): The name of the blob (file) to download/upload the image.
        image_file_output_dir (str): The local directory to save the downloaded image file.

    Returns:
        str: The local file path to the image.
    """
    try:
        # Try to download existing cached image from blob
        image_file_path = download_file_from_blob(
            container_name, image_file_blob_name, image_file_output_dir
        )
        return image_file_path

    except ResourceNotFoundError:
        # Not cached yet; fetch from service
        keyframe_id = keyframe.removesuffix(".jpg")
        image = client.get_image_from_analyze_operation(operationId, keyframe_id)
        if image is None:
            raise Exception(
                "Image retrieval from Content Understanding service returned None"
            )

        # Upload raw bytes (upload_content_to_blob now supports bytes)
        upload_content_to_blob(
            image,
            container_name,
            image_file_blob_name,
        )

        # Persist locally
        local_file_path = Path(image_file_output_dir, image_file_blob_name)
        local_file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_file_path, "wb") as f:
            f.write(image)

        return str(local_file_path)
    except Exception as e:
        raise Exception(f"Failed to get Content Understanding keyframe image: {e}")

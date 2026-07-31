import os
import pytest
import json
from unittest.mock import patch, MagicMock, mock_open, ANY
from pathlib import Path
from azure.core.exceptions import ResourceNotFoundError
from modules.content_understanding_module.content_understanding import AzureContentUnderstandingClient, create_content_understanding_client, run_content_understanding, get_content_understanding_result, get_content_understanding_images

# ----------------------------------
# Tests: create_content_understanding_client
# ----------------------------------

class TestCreateContentUnderstandingClient:
    @pytest.fixture
    def env_vars(self):
        return {
            "AZURE_CONTENT_UNDERSTANDING_ENDPOINT": "https://test-endpoint",
            "AZURE_CONTENT_UNDERSTANDING_API_VERSION": "2023-01-01",
            "AZURE_CONTENT_UNDERSTANDING_SUBSCRIPTION_KEY": "test-key",
            "AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID": "test-analyzer"
        }
    
    def test_create_content_understanding_client_success(self, env_vars):
        file_location = "https://example.com/file.mp4"
        with patch.dict(os.environ, env_vars), \
             patch("modules.content_understanding_module.content_understanding.AzureContentUnderstandingClient") as mock_client_class, \
             patch("modules.content_understanding_module.content_understanding.Settings") as mock_settings_class:
            mock_client_instance = MagicMock()
            mock_settings_instance = MagicMock()
            mock_client_class.return_value = mock_client_instance
            mock_settings_class.return_value = mock_settings_instance

            client, settings = create_content_understanding_client(file_location)

            mock_settings_class.assert_called_once_with(
                endpoint=env_vars["AZURE_CONTENT_UNDERSTANDING_ENDPOINT"],
                api_version=env_vars["AZURE_CONTENT_UNDERSTANDING_API_VERSION"],
                subscription_key=env_vars["AZURE_CONTENT_UNDERSTANDING_SUBSCRIPTION_KEY"],
                aad_token="",
                analyzer_id=env_vars["AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID"],
                file_location=file_location,
            )
            mock_client_class.assert_called_once_with(
                mock_settings_instance.endpoint,
                mock_settings_instance.api_version,
                subscription_key=mock_settings_instance.subscription_key,
                token_provider=mock_settings_instance.token_provider,
            )
            assert client == mock_client_instance
            assert settings == mock_settings_instance

    @pytest.mark.parametrize(
        "missing_keys",
        [
            ("AZURE_CONTENT_UNDERSTANDING_ENDPOINT",),
            ("AZURE_CONTENT_UNDERSTANDING_API_VERSION",),
            ("AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID",),
            (
                "AZURE_CONTENT_UNDERSTANDING_ENDPOINT",
                "AZURE_CONTENT_UNDERSTANDING_API_VERSION",
                "AZURE_CONTENT_UNDERSTANDING_ANALYZER_ID",
            ),
        ],
    )
    def test_create_content_understanding_client_missing_required_env_vars(
        self, env_vars, missing_keys
    ):
        file_location = "https://example.com/video.mp4"
        with patch.dict(os.environ, env_vars, clear=True):
            for k in missing_keys:
                os.environ.pop(k)
            with pytest.raises(ValueError) as excinfo:
                create_content_understanding_client(file_location)
            assert "Content Understanding environment variables are not fully set" in str(excinfo.value)
            
    @pytest.mark.parametrize(
        "kwargs, expected_msg",
        [
            (
                dict(endpoint="https://example.com", api_version="2023-01-01", subscription_key=None, token_provider=None),
                "Either subscription key or token provider must be provided",
            ),
            (
                dict(endpoint="https://example.com", api_version="", subscription_key="abc", token_provider=None),
                "API version must be provided",
            ),
            (
                dict(endpoint="", api_version="2023-01-01", subscription_key="abc", token_provider=None),
                "Endpoint must be provided",
            ),
        ],
    )
    def test_init_error_cases(self, kwargs, expected_msg):
        with pytest.raises(ValueError) as ei:
            AzureContentUnderstandingClient(**kwargs)
        assert expected_msg in str(ei.value)

 # ----------------------------------
# Tests: run_content_understanding
# ----------------------------------

class TestRunContentUnderstanding:
    def test_run_content_understanding_success(self):
        mock_client = MagicMock()
        mock_settings = MagicMock()
        mock_settings.analyzer_id = "analyzer-id"
        mock_settings.file_location = "file-location"
        mock_response = MagicMock()
        mock_result = {"status": "succeeded", "data": "result"}

        mock_client.begin_analyze.return_value = mock_response
        mock_client.poll_result.return_value = mock_result

        result = run_content_understanding(mock_client, mock_settings)

        mock_client.begin_analyze.assert_called_once_with("analyzer-id", "file-location")
        mock_client.poll_result.assert_called_once_with(mock_response, timeout_seconds=60 * 60, polling_interval_seconds=1)
        assert result == mock_result

    def test_run_content_understanding_poll_raises(self):
        mock_client = MagicMock()
        mock_settings = MagicMock()
        mock_settings.analyzer_id = "analyzer-id"
        mock_settings.file_location = "file-location"
        mock_response = MagicMock()

        mock_client.begin_analyze.return_value = mock_response
        mock_client.poll_result.side_effect = Exception("Polling failed")

        with pytest.raises(Exception) as excinfo:
            run_content_understanding(mock_client, mock_settings)
        assert "Polling failed" in str(excinfo.value)


# ----------------------------------
# Tests: get_content_understanding_result
# ----------------------------------

class TestGetContentUnderstandingResult:
    @pytest.fixture
    def url(self):
        return "https://example.com/file.mp4"

    @pytest.fixture
    def container_name(self):
        return "test-container"

    @pytest.fixture
    def result_file_blob_name(self):
        return "result.json"

    @pytest.fixture
    def result_file_output_dir(self, tmp_path):
        return str(tmp_path)

    def test_blob_exists(
        self, url, container_name, result_file_blob_name, result_file_output_dir
    ):
        mock_client = MagicMock()
        mock_settings = MagicMock()
        mock_result = {"status": "succeeded", "data": "test"}
        mock_file_path = f"{result_file_output_dir}/result.json"

        with patch("modules.content_understanding_module.content_understanding.create_content_understanding_client", return_value=(mock_client, mock_settings)), \
             patch("modules.content_understanding_module.content_understanding.download_file_from_blob", return_value=mock_file_path), \
             patch("builtins.open", mock_open(read_data=json.dumps(mock_result))):
            client, result = get_content_understanding_result(
                url, container_name, result_file_blob_name, result_file_output_dir
            )
            assert client == mock_client
            assert result.model_dump() == mock_result

    def test_blob_not_found(
        self, url, container_name, result_file_blob_name, result_file_output_dir
    ):
        # Mocks
        mock_client = MagicMock()
        first_settings = MagicMock()  # Not used before exception is raised
        second_settings = MagicMock()
        second_settings.analyzer_id = "analyzer-to-create"
        mock_result = {"status": "succeeded", "data": "new"}

        # get_all_analyzers returns no existing analyzer ids to force analyzer creation path
        mock_client.get_all_analyzers.return_value = {"value": []}

        # Patch targets for readability
        module_path = "modules.content_understanding_module.content_understanding"
        create_client_target = f"{module_path}.create_content_understanding_client"
        download_blob_target = f"{module_path}.download_file_from_blob"
        run_cu_target = f"{module_path}.run_content_understanding"
        upload_blob_target = f"{module_path}.upload_content_to_blob"

        # Use a grouped context manager for clarity
        with (
            patch(create_client_target, side_effect=[(mock_client, first_settings), (mock_client, second_settings)]) as mock_create,
            patch(download_blob_target, side_effect=ResourceNotFoundError("Not found")),  # Simulate missing cached result
            patch(run_cu_target, return_value=mock_result) as mock_run,
            patch(upload_blob_target) as mock_upload,
        ):
            # Act: triggers first attempt (download -> raises), then re-creation & analysis flow
            client, result = get_content_understanding_result(
                url, container_name, result_file_blob_name, result_file_output_dir
            )

            # Assert: returned objects
            assert client == mock_client
            assert result.model_dump() == mock_result

            # Assert: client creation twice (initial + retry after blob miss)
            assert mock_create.call_count == 2

            # Assert: analyzer creation attempted because list was empty
            mock_client.begin_create_analyzer.assert_called_once_with(
                analyzer_id=second_settings.analyzer_id, analyzer_template_path=ANY
            )

            # Assert: content understanding executed with second settings
            mock_run.assert_called_once_with(client=mock_client, settings=second_settings)

            # Assert: result uploaded to blob
            mock_upload.assert_called_once()

    def test_other_exception(
        self, url, container_name, result_file_blob_name, result_file_output_dir
    ):
        with patch("modules.content_understanding_module.content_understanding.create_content_understanding_client"), \
             patch("modules.content_understanding_module.content_understanding.download_file_from_blob", side_effect=Exception("Other error")):
            with pytest.raises(Exception) as excinfo:
                get_content_understanding_result(
                    url, container_name, result_file_blob_name, result_file_output_dir
                )
            assert "Other error" in str(excinfo.value)

# ----------------------------------
# Tests: get_content_understanding_images
# ----------------------------------

class TestGetContentUnderstandingImages:
    @pytest.fixture
    def keyframe(self):
        return "keyFrame.0.jpg"

    @pytest.fixture
    def operationId(self):
        return "operation-123"

    @pytest.fixture
    def container_name(self):
        return "container"

    @pytest.fixture
    def image_file_blob_name(self):
        return "keyFrame.0.jpg"

    @pytest.fixture
    def image_file_output_dir(self, tmp_path):
        return str(tmp_path)

    def test_image_exists_in_blob(
        self, keyframe, operationId, container_name, image_file_blob_name, image_file_output_dir
    ):
        expected_path = f"{image_file_output_dir}/{image_file_blob_name}"
        with patch("modules.content_understanding_module.content_understanding.download_file_from_blob", return_value=expected_path):
            result = get_content_understanding_images(
                keyframe, operationId, MagicMock(), container_name, image_file_blob_name, image_file_output_dir
            )
            assert result == expected_path

    def test_image_not_in_blob_fetch_and_upload(
        self, keyframe, operationId, container_name, image_file_blob_name, image_file_output_dir
    ):
        mock_client = MagicMock()
        image_bytes = b"image-bytes"
        mock_client.get_image_from_analyze_operation.return_value = image_bytes
        local_file_path = Path(image_file_output_dir, image_file_blob_name)

        with patch("modules.content_understanding_module.content_understanding.download_file_from_blob", side_effect=ResourceNotFoundError("Not found")), \
                patch("modules.content_understanding_module.content_understanding.upload_content_to_blob") as mock_upload, \
                patch("pathlib.Path.mkdir") as mock_mkdir, \
                patch("builtins.open", mock_open()) as m_open:
            result = get_content_understanding_images(
                keyframe, operationId, mock_client, container_name, image_file_blob_name, image_file_output_dir
            )
            mock_client.get_image_from_analyze_operation.assert_called_once_with(operationId, "keyFrame.0")
            mock_upload.assert_called_once_with(image_bytes, container_name, image_file_blob_name)
            mock_mkdir.assert_called_once_with(parents=True, exist_ok=True)
            m_open.assert_called_once_with(local_file_path, "wb")
            handle = m_open()
            handle.write.assert_called_once_with(image_bytes)
            assert result == str(local_file_path)

    def test_image_not_in_blob_returns_none_raises(
        self, keyframe, operationId, container_name, image_file_blob_name, image_file_output_dir
    ):
        mock_client = MagicMock()
        mock_client.get_image_from_analyze_operation.return_value = None
        with patch("modules.content_understanding_module.content_understanding.download_file_from_blob", side_effect=ResourceNotFoundError("Not found")):
            with pytest.raises(Exception) as excinfo:
                get_content_understanding_images(
                    keyframe, operationId, mock_client, container_name, image_file_blob_name, image_file_output_dir
                )
            assert "Image retrieval from Content Understanding service returned None" in str(excinfo.value)

    def test_other_exception_raises(
        self, keyframe, operationId, container_name, image_file_blob_name, image_file_output_dir
    ):
        with patch("modules.content_understanding_module.content_understanding.download_file_from_blob", side_effect=Exception("Other error")):
            with pytest.raises(Exception) as excinfo:
                get_content_understanding_images(
                    keyframe, operationId, MagicMock(), container_name, image_file_blob_name, image_file_output_dir
                )
            assert "Failed to get Content Understanding keyframe image" in str(excinfo.value)



      

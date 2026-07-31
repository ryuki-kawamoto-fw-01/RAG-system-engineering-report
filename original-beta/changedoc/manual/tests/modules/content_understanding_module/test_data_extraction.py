import pytest
from pathlib import Path
from unittest.mock import patch
from modules.content_understanding_module.data_extraction import extract_transcripts_fields_keyframes, get_images_from_content_understanding_result
from modules.manual_models import Content, SegmentTranscriptData


# ----------------------------------
# Tests: extract_transcripts_fields_keyframes
# ----------------------------------

class TestExtractTranscriptsFieldsKeyframes:
    def test_extract_single_segment(self):
        contents = [
            {
                "markdown": (
                    "# Video: 00:00.000 => 00:05.000\n"
                    "Width: 1920\nHeight: 1080\n\n"
                    "## Segment 0: 00:01.000 => 00:04.000\n"
                    "Segment description\n\n"
                    "Transcript\n"
                    "```\nWEBVTT\n\n00:01.000 --> 00:04.000\n"
                    "<Speaker 1>Hello world\n"
                    "<Speaker 2>Hi there\n"
                    "```\n\n"
                    "Key Frames\n"
                    "- 00:01.000 ![](keyFrame.0.jpg)\n"
                    "- 00:02.000 ![](keyFrame.1.jpg)\n"
                ),
                "fields": {
                    "Segments": {
                        "type": "array",
                        "valueArray": [
                            {
                                "type": "object",
                                "valueObject": {
                                    "SegmentId": {"type": "string", "valueString": "0"},
                                    "procedure": {"type": "string", "valueString": "Procedure text"},
                                    "StartTimeMs": {"type": "integer", "valueInteger": 1000},
                                    "EndTimeMs": {"type": "integer", "valueInteger": 4000},
                                    "Description": {
                                        "type": "string",
                                        "valueString": "Segment description"
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]
        contents_models = [Content(**c) for c in contents]
        result = extract_transcripts_fields_keyframes(contents_models)
        assert "Segment-0" in result
        assert result["Segment-0"].transcript == ["Hello world", "Hi there"]
        assert result["Segment-0"].fields == "Procedure text"
        assert result["Segment-0"].keyframes == ["keyFrame.0.jpg", "keyFrame.1.jpg"]

    def test_extract_multiple_segments(self):
        contents = [
            {
                "markdown": (
                    "# Video: 00:00.000 => 00:10.000\n"
                    "Width: 1920\nHeight: 1080\n\n"
                    "## Segment 0: 00:01.000 => 00:04.000\n"
                    "First segment description\n\n"
                    "Transcript\n"
                    "```\nWEBVTT\n\n00:01.000 --> 00:04.000\n"
                    "<Speaker 1>First segment\n"
                    "```\n\n"
                    "Key Frames\n"
                    "- 00:01.000 ![](keyFrame.0.jpg)\n"
                    "\n"
                    "## Segment 1: 00:05.000 => 00:09.000\n"
                    "Second segment description\n\n"
                    "Transcript\n"
                    "```\nWEBVTT\n\n00:05.000 --> 00:09.000\n"
                    "<Speaker 2>Second segment\n"
                    "```\n\n"
                    "Key Frames\n"
                    "- 00:05.000 ![](keyFrame.1.jpg)\n"
                    "- 00:06.000 ![](keyFrame.2.jpg)\n"
                ),
                "fields": {
                    "Segments": {
                        "type": "array",
                        "valueArray": [
                            {
                                "type": "object",
                                "valueObject": {
                                    "SegmentId": {"type": "string", "valueString": "0"},
                                    "procedure": {"type": "string", "valueString": "First procedure"},
                                    "StartTimeMs": {"type": "integer", "valueInteger": 1000},
                                    "EndTimeMs": {"type": "integer", "valueInteger": 4000},
                                    "Description": {
                                        "type": "string",
                                        "valueString": "First segment description"
                                    }
                                }
                            },
                            {
                                "type": "object",
                                "valueObject": {
                                    "SegmentId": {"type": "string", "valueString": "1"},
                                    "procedure": {"type": "string", "valueString": "Second procedure"},
                                    "StartTimeMs": {"type": "integer", "valueInteger": 5000},
                                    "EndTimeMs": {"type": "integer", "valueInteger": 9000},
                                    "Description": {
                                        "type": "string",
                                        "valueString": "Second segment description"
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        ]
        contents_models = [Content(**c) for c in contents]
        result = extract_transcripts_fields_keyframes(contents_models)
        assert "Segment-0" in result
        assert "Segment-1" in result
        assert result["Segment-0"].transcript == ["First segment"]
        assert result["Segment-0"].fields == "First procedure"
        assert result["Segment-0"].keyframes == ["keyFrame.0.jpg"]
        assert result["Segment-1"].transcript == ["Second segment"]
        assert result["Segment-1"].fields == "Second procedure"
        assert result["Segment-1"].keyframes == ["keyFrame.1.jpg", "keyFrame.2.jpg"]

    def test_empty_contents(self):
        contents = []
        result = extract_transcripts_fields_keyframes(contents)
        assert result == {}

    def test_missing_speaker(self):
        contents = [
            {
                "markdown": (
                    "# Video: 00:00.000 => 00:05.000\n"
                    "Width: 1920\nHeight: 1080\n\n"
                    "## Segment 0: 00:01.000 => 00:04.000\n"
                    "Desc\n\n"
                    "Transcript\n"
                    "```\nWEBVTT\n\n00:01.000 --> 00:04.000\n"
                    "No speaker tags here\n"
                    "```\n\n"
                    "Key Frames\n"
                    "- 00:01.000 ![](keyFrame.0.jpg)\n"
                ),
                "fields": {
                    "Segments": {
                        "type": "array",
                        "valueArray": [
                            {
                                "type": "object",
                                "valueObject": {
                                    "SegmentId": {"type": "string", "valueString": "0"},
                                    "procedure": {"type": "string", "valueString": "Procedure text"},
                                    "StartTimeMs": {"type": "integer", "valueInteger": 1000},
                                    "EndTimeMs": {"type": "integer", "valueInteger": 4000},
                                    "Description": {"type": "string", "valueString": "Desc"}
                                }
                            }
                        ]
                    }
                }
            }
        ]
        contents_models = [Content(**c) for c in contents]
        result = extract_transcripts_fields_keyframes(contents_models)
        assert result["Segment-0"].transcript == []

    def test_no_keyframes(self):
        contents = [
            {
                "markdown": (
                    "# Video: 00:00.000 => 00:05.000\n"
                    "Width: 1920\nHeight: 1080\n\n"
                    "## Segment 0: 00:01.000 => 00:04.000\n"
                    "Desc\n\n"
                    "Transcript\n"
                    "```\nWEBVTT\n\n00:01.000 --> 00:04.000\n"
                    "<Speaker 1>Only transcript\n"
                    "```\n\n"
                    "Key Frames\n"
                ),
                "fields": {
                    "Segments": {
                        "type": "array",
                        "valueArray": [
                            {
                                "type": "object",
                                "valueObject": {
                                    "SegmentId": {"type": "string", "valueString": "0"},
                                    "procedure": {"type": "string", "valueString": "Procedure text"},
                                    "StartTimeMs": {"type": "integer", "valueInteger": 1000},
                                    "EndTimeMs": {"type": "integer", "valueInteger": 4000},
                                    "Description": {"type": "string", "valueString": "Desc"}
                                }
                            }
                        ]
                    }
                }
            }
        ]
        contents_models = [Content(**c) for c in contents]
        result = extract_transcripts_fields_keyframes(contents_models)
        assert result["Segment-0"].keyframes == []


# ----------------------------------
# Tests: get_images_from_content_understanding_result
# ----------------------------------

class TestGetImagesFromContentUnderstandingResult:
    class DummyClient:
        pass

    @pytest.fixture
    def transcripts_fields_keyframes(self):
        return {
            "Segment-0": SegmentTranscriptData(
                transcript=["Hello world"],
                fields="Procedure text",
                keyframes=["keyFrame.0.jpg", "keyFrame.1.jpg"]
            ),
            "Segment-1": SegmentTranscriptData(
                transcript=["Hi again"],
                fields="Another procedure",
                keyframes=["keyFrame.2.jpg"]
            )
        }

    @patch("modules.content_understanding_module.data_extraction.get_content_understanding_images")
    def test_basic(self, mock_get_images, transcripts_fields_keyframes):
        mock_get_images.side_effect = lambda keyframe, *_: f"/tmp/keyframes/{keyframe}"

        temp_dir = "/tmp"
        container_name = "container"
        blob_folder_name = "blobfolder"
        client = self.DummyClient()
        operationId = "opid"

        result = get_images_from_content_understanding_result(
            temp_dir, container_name, blob_folder_name, client, operationId, transcripts_fields_keyframes
        )

        assert result == [
            ["/tmp/keyframes/keyFrame.0.jpg", "/tmp/keyframes/keyFrame.1.jpg"],
            ["/tmp/keyframes/keyFrame.2.jpg"]
        ]
        expected_calls = [
            ("keyFrame.0.jpg", operationId, client, container_name, f"{blob_folder_name}/keyframes/0/keyFrame.0.jpg", str(Path(temp_dir, "keyframes"))),
            ("keyFrame.1.jpg", operationId, client, container_name, f"{blob_folder_name}/keyframes/0/keyFrame.1.jpg", str(Path(temp_dir, "keyframes"))),
            ("keyFrame.2.jpg", operationId, client, container_name, f"{blob_folder_name}/keyframes/1/keyFrame.2.jpg", str(Path(temp_dir, "keyframes"))),
        ]
        actual_calls = [tuple(call.args) for call in mock_get_images.call_args_list]
        for expected in expected_calls:
            assert expected in actual_calls

    @patch("modules.content_understanding_module.data_extraction.get_content_understanding_images")
    def test_empty_keyframes(self, mock_get_images):
        transcripts_fields_keyframes = {
            "Segment-0": {
                "transcript": ["Hello world"],
                "fields": "Procedure text",
                "keyframes": []
            }
        }
        temp_dir = "/tmp"
        container_name = "container"
        blob_folder_name = "blobfolder"
        client = self.DummyClient()
        operationId = "opid"

        result = get_images_from_content_understanding_result(
            temp_dir, container_name, blob_folder_name, client, operationId, transcripts_fields_keyframes
        )
        assert result == [[]]
        mock_get_images.assert_not_called()

    @patch("modules.content_understanding_module.data_extraction.get_content_understanding_images")
    def test_no_segments(self, mock_get_images):
        transcripts_fields_keyframes = {}
        temp_dir = "/tmp"
        container_name = "container"
        blob_folder_name = "blobfolder"
        client = self.DummyClient()
        operationId = "opid"

        result = get_images_from_content_understanding_result(
            temp_dir, container_name, blob_folder_name, client, operationId, transcripts_fields_keyframes
        )
        assert result == []
        mock_get_images.assert_not_called()

    @patch("modules.content_understanding_module.data_extraction.get_content_understanding_images")
    def test_preserves_order(self, mock_get_images):
        def side_effect(keyframe, *_):
            return f"/tmp/keyframes/{keyframe}"
        mock_get_images.side_effect = side_effect

        transcripts_fields_keyframes = {
            "Segment-0": {
                "transcript": ["Hello world"],
                "fields": "Procedure text",
                "keyframes": ["kf1.jpg", "kf2.jpg", "kf3.jpg"]
            }
        }
        temp_dir = "/tmp"
        container_name = "container"
        blob_folder_name = "blobfolder"
        client = self.DummyClient()
        operationId = "opid"

        result = get_images_from_content_understanding_result(
            temp_dir, container_name, blob_folder_name, client, operationId, transcripts_fields_keyframes
        )
        assert result == [["/tmp/keyframes/kf1.jpg", "/tmp/keyframes/kf2.jpg", "/tmp/keyframes/kf3.jpg"]]
        assert result[0][0].endswith("kf1.jpg")
        assert result[0][1].endswith("kf2.jpg")
        assert result[0][2].endswith("kf3.jpg")

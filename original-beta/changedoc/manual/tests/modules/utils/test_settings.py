import pytest
from pydantic import ValidationError

from modules.manual_models import CreateManualRequest, SaveManualRequest


def test_auto_threshold_with_valid_similarity_raises():
    # similarity_threshold in [0, 1] and is_auto_threshold True should error
    for val in [0.0, 0.5, 1.0]:
        with pytest.raises(ValidationError, match="When is_auto_threshold is True"):
            CreateManualRequest.model_validate(
                {"url": "https://example.com", "similarity_threshold": val}
            )


def test_auto_threshold_with_invalid_similarity_passes():
    # similarity_threshold outside [0, 1] and is_auto_threshold True should be ok
    for val in [-0.1, 1.1, 100]:
        CreateManualRequest.model_validate(
            {"url": "https://example.com", "similarity_threshold": val}
        )


def test_manual_threshold_with_invalid_similarity_raises():
    # similarity_threshold outside [0, 1] and is_auto_threshold False should error
    for val in [-0.1, 1.1, 100]:
        with pytest.raises(ValidationError, match="When is_auto_threshold is False"):
            CreateManualRequest.model_validate(
                {
                    "url": "https://example.com",
                    "similarity_threshold": val,
                    "is_auto_threshold": False,
                }
            )


def test_manual_threshold_with_valid_similarity_passes():
    # similarity_threshold in [0, 1] and is_auto_threshold False should be ok
    for val in [0.0, 0.5, 1.0]:
        CreateManualRequest.model_validate(
            {
                "url": "https://example.com",
                "similarity_threshold": val,
                "is_auto_threshold": False,
            }
        )


def test_save_manual_requires_manual_id_and_steps():
    with pytest.raises(ValidationError, match="manualIdとstepsは必須です"):
        SaveManualRequest.model_validate({"manualId": "", "steps": []})
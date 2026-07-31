from __future__ import annotations

import pytest

from modules.llm_module.models import Settings


# ----------------------------------
# Tests: Settings.token_provider
# ----------------------------------

class TestSettingsTokenProvider:
    def test_token_provider_none_when_only_subscription_key(self):
        s = Settings(
            endpoint="https://example.endpoint",
            api_version="2024-01-01",
            subscription_key="dummy-key",
            aad_token=None,
            analyzer_id="analyzer-x",
            file_location="/tmp/file",
        )
        assert s.token_provider is None, "Expected None when aad_token is not provided"

    def test_token_provider_returns_callable_when_aad_token(self):
        token = "aad-token-123"
        s = Settings(
            endpoint="https://example.endpoint",
            api_version="2024-01-01",
            subscription_key=None,  # not needed when aad_token present
            aad_token=token,
            analyzer_id="analyzer-x",
            file_location="/tmp/file",
        )
        provider = s.token_provider
        assert callable(provider), "Token provider should be callable when aad_token is set"
        assert provider() == token, "Callable should return the original aad_token"

    def test_init_raises_when_no_key_and_no_token(self):
        with pytest.raises(ValueError):
            Settings(
                endpoint="https://example.endpoint",
                api_version="2024-01-01",
                subscription_key=None,
                aad_token=None,
                analyzer_id="analyzer-x",
                file_location="/tmp/file",
            )

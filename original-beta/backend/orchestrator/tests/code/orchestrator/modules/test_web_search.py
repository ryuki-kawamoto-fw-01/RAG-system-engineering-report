import asyncio
import sys
from pathlib import Path

import pytest


def _add_orchestrator_to_syspath() -> None:
    here = Path(__file__).resolve()
    for parent in here.parents:
        candidate = parent / "backend" / "orchestrator"
        if (candidate / "function_app.py").exists():
            sys.path.insert(0, str(candidate))
            return
    raise RuntimeError("Could not locate backend/orchestrator to add to sys.path")


_add_orchestrator_to_syspath()

import modules.web_search as target  # noqa: E402


class _Resp:
    def __init__(self, payload, status_ok=True):
        self._payload = payload
        self._status_ok = status_ok

    def raise_for_status(self):
        if not self._status_ok:
            raise RuntimeError("bad")

    def json(self):
        return self._payload


def test_format_search_result_unescapes_snippet():
    # N-01-001
    item = {"name": "t", "url": "u", "snippet": "a&amp;b"}
    out = target.format_search_result(item, 0)
    assert out["id"] == 1
    assert out["snippet"] == "a&b"


def test_search_bing_builds_url_headers_and_params(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    monkeypatch.setenv("BING_SEARCH_API_KEY", "KEY")
    monkeypatch.setenv("BING_SEARCH_ENDPOINT", "https://bing.example/")

    seen = {}

    def fake_get(url, headers=None, params=None):
        seen["url"] = url
        seen["headers"] = headers
        seen["params"] = params
        return _Resp({"ok": True})

    monkeypatch.setattr(target.requests, "get", fake_get)
    out = target.search_bing("q")
    assert out == {"ok": True}
    assert seen["url"].endswith("/v7.0/search")
    assert seen["headers"]["Ocp-Apim-Subscription-Key"] == "KEY"
    assert seen["params"]["q"] == "q"


def test_search_bing_raises_on_http_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-002
    monkeypatch.setenv("BING_SEARCH_API_KEY", "KEY")
    monkeypatch.setenv("BING_SEARCH_ENDPOINT", "https://bing.example/")

    monkeypatch.setattr(target.requests, "get", lambda *a, **k: _Resp({"ok": False}, status_ok=False))
    with pytest.raises(RuntimeError, match="bad"):
        target.search_bing("q")


def test_search_bing_missing_env_raises_key_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-004
    monkeypatch.delenv("BING_SEARCH_API_KEY", raising=False)
    monkeypatch.delenv("BING_SEARCH_ENDPOINT", raising=False)
    with pytest.raises(KeyError):
        target.search_bing("q")


def test_enclude_wikipedia_filters_out_wiki_urls():
    # E-01-001
    search_results = {
        "webPages": {
            "value": [
                {"url": "https://ja.wikipedia.org/wiki/X"},
                {"url": "https://example.com/a"},
            ]
        }
    }
    out = target.enclude_wikipedia(search_results)
    assert len(out) == 1
    assert out[0]["url"] == "https://example.com/a"


@pytest.mark.parametrize(
    "search_results,expected_len",
    [
        # L-01-001
        pytest.param({}, 0, id="L-01-001"),
        # L-01-002
        pytest.param({"webPages": {}}, 0, id="L-01-002"),
        # L-01-003
        pytest.param({"webPages": {"value": []}}, 0, id="L-01-003"),
    ],
)
def test_enclude_wikipedia_returns_empty_when_keys_missing(search_results, expected_len):
    out = target.enclude_wikipedia(search_results)
    assert len(out) == expected_len


def test_preprocess_search_results_limits_count_and_defaults_when_empty():
    # L-01-001
    filtered = [
        {"name": "t1", "url": "u1", "snippet": "s1"},
        {"name": "t2", "url": "u2", "snippet": "s2"},
        {"name": "t3", "url": "u3", "snippet": "s3"},
    ]
    out = target.preprocess_search_results(filtered, max_results=2)
    assert len(out) == 2

    out2 = target.preprocess_search_results([], max_results=2)
    assert len(out2) == 1
    assert out2[0]["title"] == "No results found"


def test_preprocess_search_results_with_zero_max_results_returns_default():
    # L-01-004
    out = target.preprocess_search_results([], max_results=0)
    assert len(out) == 1
    assert out[0]["title"] == "No results found"


def test_retireve_search_results_uses_filter_and_preprocess(monkeypatch: pytest.MonkeyPatch):
    # N-01-002
    monkeypatch.setattr(target, "search_bing", lambda k: {"x": k})
    monkeypatch.setattr(target, "enclude_wikipedia", lambda s: [{"name": "t", "url": "u", "snippet": "s"}])
    monkeypatch.setattr(target, "preprocess_search_results", lambda f: [{"title": "t", "url": "u", "snippet": "s"}])
    out = target.retireve_search_results("k")
    assert "title: t" in out


def test_retireve_search_results_propagates_search_error(monkeypatch: pytest.MonkeyPatch):
    # E-01-003
    monkeypatch.setattr(target, "search_bing", lambda k: (_ for _ in ()).throw(RuntimeError("boom")))
    with pytest.raises(RuntimeError, match="boom"):
        target.retireve_search_results("k")


def test_search_bing_async_runs_executor(monkeypatch: pytest.MonkeyPatch):
    # I-01-002
    monkeypatch.setattr(target, "retireve_search_results", lambda q: f"R:{q}")
    out = asyncio.run(target.search_bing_async("q"))
    assert out == "R:q"


def test_search_keywords_async_gathers_results(monkeypatch: pytest.MonkeyPatch):
    # I-01-003
    async def fake_search(keyword: str):
        return f"X:{keyword}"

    monkeypatch.setattr(target, "search_bing_async", fake_search)
    out = asyncio.run(target.search_keywords_async(["a", "b"]))
    assert out == ["X:a", "X:b"]


def test_retireve_search_results_async_concatenates(monkeypatch: pytest.MonkeyPatch):
    # N-01-003
    async def fake_keywords_async(_keywords):
        return ["1", "2", "3"]

    monkeypatch.setattr(target, "search_keywords_async", fake_keywords_async)
    out = target.retireve_search_results_async(["k"])
    assert out == "123"


def test_retireve_search_results_async_empty_list_returns_empty_string(monkeypatch: pytest.MonkeyPatch):
    # L-01-005
    async def fake_keywords_async(_keywords):
        return []

    monkeypatch.setattr(target, "search_keywords_async", fake_keywords_async)
    out = target.retireve_search_results_async([])
    assert out == ""


def test_retireve_search_results_joins_formatted_items(monkeypatch: pytest.MonkeyPatch):
    # I-01-001
    def fake_search_bing(keyword: str):
        assert keyword == "k"
        return {
            "webPages": {
                "value": [
                    {"name": "t", "url": "https://example.com", "snippet": "s"},
                ]
            }
        }

    monkeypatch.setattr(target, "search_bing", fake_search_bing)
    s = target.retireve_search_results("k")
    assert "title: t" in s
    assert "url: https://example.com" in s

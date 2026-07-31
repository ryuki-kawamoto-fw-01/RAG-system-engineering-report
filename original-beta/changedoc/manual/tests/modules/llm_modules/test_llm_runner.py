from __future__ import annotations

import base64
import json
import asyncio
from semantic_kernel.contents import ChatMessageContent, TextContent, ImageContent
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch, MagicMock, AsyncMock

import pytest

from modules.llm_module import llm_runner


# ----------------------------------
# Tests: encode_image
# ----------------------------------

class TestEncodeImage:
    def test_encode_image_base64(self, tmp_path: Path):
        p = tmp_path / "img.png"
        content = b"binarydata123"
        p.write_bytes(content)
        encoded = llm_runner.encode_image(str(p))
        assert encoded == base64.b64encode(content).decode()


# ----------------------------------
# Tests: refine_output_text
# ----------------------------------

class TestRefineOutputText:
    @pytest.mark.parametrize(
        "raw, expected",
        [
            ("手順: 1. ボタンを押す", "ボタンを押す"),  # single step -> remove label & numbering
            ("手順: 1. A\n2. B", "1. A\n2. B"),    # multi-step: keep numbering (only remove label)
            ("  手順:   1. 実行  ", "実行"),
            ("(概要のみ)", "(概要のみ)"),            # unchanged when no pattern
        ],
    )
    def test_refine(self, raw, expected):
        assert llm_runner.refine_output_text(raw) == expected


# ----------------------------------
# Helper for async execute_llm tests
# ----------------------------------

def _make_fake_response(answer: str):
    content = json.dumps({"answer": answer})
    inner = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )
    return SimpleNamespace(inner_content=inner)


# ----------------------------------
# Tests: execute_llm (async)
# ----------------------------------

class TestExecuteLLM:
    def test_execute_success(self):
        kernel = MagicMock()
        service = MagicMock()
        service.get_chat_message_content = AsyncMock(return_value=_make_fake_response("結果"))
        kernel.get_service.return_value = service

        user_contents = ChatMessageContent(role="user", items=[TextContent(text="ユーザーメッセージ")])
        out = asyncio.run(llm_runner.execute_llm(
            kernel=kernel,
            system_prompt="システムプロンプトメッセージ",
            user_contents=user_contents,
            response_format=llm_runner.ProcedureResponseContent,
        ))
        assert out == "結果"
        service.get_chat_message_content.assert_awaited()

    def test_execute_content_filter_retries_then_empty(self):
        kernel = MagicMock()
        service = MagicMock()

        class ContentFilterError(Exception):
            pass

        async def side_effect(*_, **__):  # noqa: ANN001
            raise ContentFilterError("content_filter triggered")

        service.get_chat_message_content = AsyncMock(side_effect=side_effect)
        kernel.get_service.return_value = service

        with patch("modules.llm_module.llm_runner.asyncio.sleep", new=AsyncMock()):
            user_contents = ChatMessageContent(role="user", items=[TextContent(text="hi")])
            out = asyncio.run(
                llm_runner.execute_llm(
                    kernel=kernel,
                    system_prompt="システムプロンプトメッセージ",
                    user_contents=user_contents,
                    response_format=llm_runner.ProcedureResponseContent,
                )
            )
        assert out == ""
        assert service.get_chat_message_content.await_count == 3

    def test_execute_rate_limit_retry_then_success(self):
        kernel = MagicMock()
        service = MagicMock()
        responses = [Exception("429 too many requests"), _make_fake_response("OK")]

        async def side_effect(*_, **__):  # noqa: ANN001
            r = responses.pop(0)
            if isinstance(r, Exception):
                raise r
            return r

        service.get_chat_message_content = AsyncMock(side_effect=side_effect)
        kernel.get_service.return_value = service
        with patch("modules.llm_module.llm_runner.asyncio.sleep", new=AsyncMock()):
            user_contents = ChatMessageContent(role="user", items=[TextContent(text="hi")])
            out = asyncio.run(
                llm_runner.execute_llm(
                    kernel=kernel,
                    system_prompt="sys",
                    user_contents=user_contents,
                    response_format=llm_runner.ProcedureResponseContent,
                )
            )
        assert out == "OK"
        assert service.get_chat_message_content.await_count == 2

    def test_execute_connection_error_retries_then_success(self):
        """APIConnectionError / Connection error のリトライ挙動を検証"""
        kernel = MagicMock()
        service = MagicMock()
        responses = [Exception("APIConnectionError temporary"), _make_fake_response("OK_CONN")]  # first fails, second succeeds

        async def side_effect(*_, **__):  # noqa: ANN001
            r = responses.pop(0)
            if isinstance(r, Exception):
                raise r
            return r

        service.get_chat_message_content = AsyncMock(side_effect=side_effect)
        kernel.get_service.return_value = service
        with patch("modules.llm_module.llm_runner.asyncio.sleep", new=AsyncMock()):
            user_contents = ChatMessageContent(role="user", items=[TextContent(text="hi")])
            out = asyncio.run(
                llm_runner.execute_llm(
                    kernel=kernel,
                    system_prompt="sys",
                    user_contents=user_contents,
                    response_format=llm_runner.ProcedureResponseContent,
                )
            )
        assert out == "OK_CONN"
        assert service.get_chat_message_content.await_count == 2

    def test_execute_connection_error_exceeds_max_retries(self):
        """最大リトライ回数超過で例外を再送出することを検証"""
        kernel = MagicMock()
        service = MagicMock()
        # 7回連続エラー (max_retries=6 を超える)
        async def side_effect(*_, **__):  # noqa: ANN001
            raise Exception("Connection error: network unreachable")

        service.get_chat_message_content = AsyncMock(side_effect=side_effect)
        kernel.get_service.return_value = service
        with patch("modules.llm_module.llm_runner.asyncio.sleep", new=AsyncMock()):
            user_contents = ChatMessageContent(role="user", items=[TextContent(text="hi")])
            with pytest.raises(Exception):
                asyncio.run(
                    llm_runner.execute_llm(
                        kernel=kernel,
                        system_prompt="sys",
                        user_contents=user_contents,
                        response_format=llm_runner.ProcedureResponseContent,
                    )
                )
        # attempt > max_retries になるので 7 回呼ばれるはず
        assert service.get_chat_message_content.await_count == 7

    def test_execute_other_exception_reraised(self):
        kernel = MagicMock()
        service = MagicMock()

        async def side_effect(*_, **__):  # noqa: ANN001
            raise RuntimeError("unexpected failure")

        service.get_chat_message_content = AsyncMock(side_effect=side_effect)
        kernel.get_service.return_value = service
        with patch("modules.llm_module.llm_runner.asyncio.sleep", new=AsyncMock()):
            with pytest.raises(RuntimeError):
                user_contents = ChatMessageContent(role="user", items=[TextContent(text="hi")])
                asyncio.run(
                    llm_runner.execute_llm(
                        kernel=kernel,
                        system_prompt="sys",
                        user_contents=user_contents,
                        response_format=llm_runner.ProcedureResponseContent,
                    )
                )

    def test_execute_with_assistant_prompt_calls_add_assistant_message(self):
        kernel = MagicMock()
        service = MagicMock()
        service.get_chat_message_content = AsyncMock(return_value=_make_fake_response("OK"))
        kernel.get_service.return_value = service

        class DummyChatHistory:
            def __init__(self):
                self.system_messages = []
                self.assistant_messages = []
                self.user_messages = []
            def add_system_message(self, msg):
                self.system_messages.append(msg)
            def add_assistant_message(self, msg):
                self.assistant_messages.append(msg)
            def add_message(self, content):
                self.user_messages.append(content)

        user_contents = ChatMessageContent(role="user", items=[TextContent(text="hi")])
        with patch("modules.llm_module.llm_runner.ChatHistory", DummyChatHistory):
            out = asyncio.run(llm_runner.execute_llm(
                kernel=kernel,
                system_prompt="sys",
                user_contents=user_contents,
                response_format=llm_runner.ProcedureResponseContent,
                assistant_prompt="assistant context",
            ))
        assert out == "OK"
        # Verify assistant message was added
        # We check via service call argument (chat_history passed in)
        passed_history = service.get_chat_message_content.call_args.kwargs["chat_history"]
        assert "assistant context" in passed_history.assistant_messages
        assert passed_history.system_messages == ["sys"]

    def test_execute_without_assistant_prompt_skips_add_assistant_message(self):
        kernel = MagicMock()
        service = MagicMock()
        service.get_chat_message_content = AsyncMock(return_value=_make_fake_response("OK2"))
        kernel.get_service.return_value = service

        class DummyChatHistory:
            def __init__(self):
                self.system_messages = []
                self.assistant_messages = []
                self.user_messages = []
            def add_system_message(self, msg):
                self.system_messages.append(msg)
            def add_assistant_message(self, msg):
                self.assistant_messages.append(msg)
            def add_message(self, content):
                self.user_messages.append(content)

        user_contents = ChatMessageContent(role="user", items=[TextContent(text="hi")])
        with patch("modules.llm_module.llm_runner.ChatHistory", DummyChatHistory):
            out = asyncio.run(llm_runner.execute_llm(
                kernel=kernel,
                system_prompt="sys2",
                user_contents=user_contents,
                response_format=llm_runner.ProcedureResponseContent,
                assistant_prompt="",
            ))
        assert out == "OK2"
        passed_history = service.get_chat_message_content.call_args.kwargs["chat_history"]
        assert passed_history.assistant_messages == []
        assert passed_history.system_messages == ["sys2"]

# ----------------------------------
# Tests: generate_procedure (async)
# ----------------------------------

class TestGenerateProcedureLLM:
    @pytest.fixture
    def kernel(self):
        return MagicMock()

    def test_generate_procedure_skips_empty_procedure(self, tmp_path: Path, kernel):
        img = tmp_path / "empty.png"; img.write_bytes(b"data")
        with patch("modules.llm_module.llm_runner.execute_llm", return_value="") as mock_exec:
            steps, imgs = asyncio.run(llm_runner.generate_procedure(
                segment_idx=0,
                kernel=kernel,
                user_prompt="ユーザー説明",
                field="補助",
                img_paths=[str(img)],
                download_responses=[],
                download_response_image_paths=[],
            ))
        mock_exec.assert_called_once()  # now normal MagicMock since await not used
        assert steps == []
        assert imgs == []

    def test_generate_procedure_uses_download_cache(self, tmp_path: Path, kernel):
        img1 = tmp_path / "1.png"; img1.write_bytes(b"d")
        with patch("modules.llm_module.llm_runner.execute_llm") as mock_exec:
            steps, imgs = asyncio.run(llm_runner.generate_procedure(
                segment_idx=0,
                kernel=kernel,
                user_prompt="ユーザー説明",
                field="補助",
                img_paths=[str(img1)],
                download_responses=["キャッシュ手順"],
                download_response_image_paths=[str(img1)],
            ))
        mock_exec.assert_not_called()
        assert steps == ["キャッシュ手順"]
        assert imgs == [str(img1)]

# ----------------------------------
# Tests: deduplicate_images
# ----------------------------------

class TestDeduplicateImages:
    def test_deduplicate_images_duplicate(self, tmp_path: Path):
        # set up two image paths
        img1 = tmp_path / "x1.png"; img1.write_bytes(b"1")
        img2 = tmp_path / "x2.png"; img2.write_bytes(b"2")

        # Patch compute_cosine_similarity & execute_llm & ImageContent to avoid real image processing
        async def fake_execute_llm(**kwargs):  # type: ignore[no-untyped-def]
            return "1"  # indicate duplicate

        with patch("modules.llm_module.llm_runner.compute_cosine_similarity", return_value=0.999), \
           patch("modules.llm_module.llm_runner.execute_llm", side_effect=fake_execute_llm), \
           patch("modules.llm_module.llm_runner.ImageContent.from_image_file", return_value=ImageContent(data="IMG")):
            out = asyncio.run(llm_runner.deduplicate_images(
                img_idx=0,
                kernel=MagicMock(),
                pre_img_sets=(0, str(img1), [0.1]),
                current_img_sets=(0, str(img2), [0.2]),
            ))
        assert out == (0, str(img1), [0.1])

    def test_deduplicate_images_not_duplicate(self, tmp_path: Path):
        img1 = tmp_path / "y1.png"; img1.write_bytes(b"1")
        img2 = tmp_path / "y2.png"; img2.write_bytes(b"2")

        async def fake_execute_llm(**kwargs):  # type: ignore[no-untyped-def]
            return "0"  # not duplicate

        with patch("modules.llm_module.llm_runner.compute_cosine_similarity", return_value=0.5), \
           patch("modules.llm_module.llm_runner.execute_llm", side_effect=fake_execute_llm), \
           patch("modules.llm_module.llm_runner.ImageContent.from_image_file", return_value=ImageContent(data="IMG")):
            out = asyncio.run(llm_runner.deduplicate_images(
                img_idx=0,
                kernel=MagicMock(),
                pre_img_sets=(0, str(img1), [0.1]),
                current_img_sets=(0, str(img2), [0.2]),
            ))
        assert out is None

# ----------------------------------
# Tests: run_llm
# ----------------------------------

class TestRunLLM:
    def test_run_llm_augment_and_collect(self, tmp_path: Path):
        img1 = tmp_path / "s1.png"; img1.write_bytes(b"1")
        img2 = tmp_path / "s2.png"; img2.write_bytes(b"2")
        user_prompts = [["手順1", "手順2"], ["手順2", "手順3"]]
        fields = ["F1", "F2"]
        image_paths_list = [[str(img1)], [str(img2)]]
        vectors_list = [[[0.1, 0.2]], [[0.3, 0.4]]]

        captured_user_prompts: list[str] = []

        async def fake_process_llm(segment_idx, kernel, user_prompt, field, img_paths, download_responses, download_response_image_paths):  # noqa: PLR0913
            captured_user_prompts.append(user_prompt)
            return ([f"step for {Path(img_paths[0]).name}"], [img_paths[0]])

        class DummyService:
            service_id = "azure_openai_chat"

        with patch.dict("os.environ", {
            "AZURE_OPENAI_MODEL_NAME": "m",
            "AZURE_OPENAI_API_VERSION": "2024-01-01",
            "AZURE_OPENAI_ENDPOINT": "https://x",
            "AZURE_OPENAI_API_KEY": "k",
            "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=00000000-0000-0000-0000-000000000000",
        }):
            with patch("modules.llm_module.llm_runner.AzureChatCompletion", return_value=DummyService()), \
                 patch("modules.llm_module.llm_runner.generate_procedure", side_effect=fake_process_llm):
                steps, imgs = llm_runner.run_llm(
                    user_prompts=user_prompts,
                    fields=fields,
                    image_paths_list=image_paths_list,
                    vectors_list=vectors_list,
                    is_auto_threshold=False,
                    download_responses=[],
                    download_response_image_paths=[],
                )
        assert steps == ["step for s1.png", "step for s2.png"]
        assert imgs == [str(img1), str(img2)]
        assert captured_user_prompts[0].split("\n") == ["手順1", "手順2", "手順3"]
        assert captured_user_prompts[1].split("\n") == ["手順2", "手順3"]

    @pytest.mark.parametrize(
        "missing_key,expected_msg",
        [
            ("AZURE_OPENAI_MODEL_NAME", "AZURE_OPENAI_MODEL_NAME environment variable is not set"),
            ("AZURE_OPENAI_API_VERSION", "AZURE_OPENAI_API_VERSION environment variable is not set"),
            ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_ENDPOINT environment variable is not set"),
            ("AZURE_OPENAI_API_KEY", "AZURE_OPENAI_API_KEY environment variable is not set"),
            ("APPLICATIONINSIGHTS_CONNECTION_STRING", "APPLICATIONINSIGHTS_CONNECTION_STRING environment variable is not set"),
        ],
    )
    def test_run_llm_missing_env(self, missing_key, expected_msg, tmp_path: Path):
        img = tmp_path / "x.png"; img.write_bytes(b"1")
        base_env = {
            "AZURE_OPENAI_MODEL_NAME": "m",
            "AZURE_OPENAI_API_VERSION": "2024-01-01",
            "AZURE_OPENAI_ENDPOINT": "https://x",
            "AZURE_OPENAI_API_KEY": "k",
            "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=00000000-0000-0000-0000-000000000000",
        }
        base_env.pop(missing_key)
        with patch.dict("os.environ", base_env, clear=True):
            with pytest.raises(ValueError) as exc:
                llm_runner.run_llm(
                    user_prompts=[["テスト"]],
                    fields=["Field"],
                    image_paths_list=[[str(img)]],
                    vectors_list=[[[0.1]]],
                    is_auto_threshold=False,
                    download_responses=[],
                    download_response_image_paths=[],
                )
        assert str(exc.value) == expected_msg

    def test_run_llm_with_auto_threshold_removes_duplicate(self, tmp_path: Path):
        # Two images in one segment; first should be removed by dedup logic
        img1 = tmp_path / "a.png"; img1.write_bytes(b"1")
        img2 = tmp_path / "b.png"; img2.write_bytes(b"2")
        user_prompts = [["P1"],]
        fields = ["F1"]
        image_paths_list = [[str(img1), str(img2)]]
        vectors_list = [[[0.1], [0.2]]]

        async def fake_process_llm(segment_idx, kernel, user_prompt, field, img_paths, download_responses, download_response_image_paths):  # noqa: PLR0913
            # After dedup, only second image remains
            assert img_paths == [str(img2)]
            return (["step for b.png"], [str(img2)])

        # Patch deduplicate_across_segments to mark first image as duplicate
        async def fake_dedup(img_idx, kernel, pre_img_sets, current_img_sets):  # noqa: ANN001
            seg_idx, img_path, vec = pre_img_sets
            return seg_idx, img_path, vec  # always mark previous as duplicate

        class DummyService:
            service_id = "azure_openai_chat"

        with patch.dict("os.environ", {
            "AZURE_OPENAI_MODEL_NAME": "m",
            "AZURE_OPENAI_API_VERSION": "2024-01-01",
            "AZURE_OPENAI_ENDPOINT": "https://x",
            "AZURE_OPENAI_API_KEY": "k",
            "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=00000000-0000-0000-0000-000000000000",
        }):
            with patch("modules.llm_module.llm_runner.AzureChatCompletion", return_value=DummyService()), \
                 patch("modules.llm_module.llm_runner.generate_procedure", side_effect=fake_process_llm), \
                 patch("modules.llm_module.llm_runner.deduplicate_images", side_effect=fake_dedup):
                steps, imgs = llm_runner.run_llm(
                    user_prompts=user_prompts,
                    fields=fields,
                    image_paths_list=image_paths_list,
                    vectors_list=vectors_list,
                    is_auto_threshold=True,
                    download_responses=[],
                    download_response_image_paths=[],
                )
        assert steps == ["step for b.png"]
        assert imgs == [str(img2)]

    def test_run_llm_with_auto_threshold_no_removal(self, tmp_path: Path):
        # No images removed when deduplicate returns None
        img1 = tmp_path / "c.png"; img1.write_bytes(b"1")
        img2 = tmp_path / "d.png"; img2.write_bytes(b"2")
        user_prompts = [["Q1"],]
        fields = ["F1"]
        image_paths_list = [[str(img1), str(img2)]]
        vectors_list = [[[0.3], [0.4]]]

        async def fake_process_llm(segment_idx, kernel, user_prompt, field, img_paths, download_responses, download_response_image_paths):  # noqa: PLR0913
            # Both images should remain
            assert img_paths == [str(img1), str(img2)]
            # Return two steps (simulate aggregating)
            return (["step c", "step d"], [str(img1), str(img2)])

        async def fake_dedup(*_, **__):  # noqa: ANN001
            return None

        class DummyService:
            service_id = "azure_openai_chat"

        with patch.dict("os.environ", {
            "AZURE_OPENAI_MODEL_NAME": "m",
            "AZURE_OPENAI_API_VERSION": "2024-01-01",
            "AZURE_OPENAI_ENDPOINT": "https://x",
            "AZURE_OPENAI_API_KEY": "k",
            "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=00000000-0000-0000-0000-000000000000",
        }):
            with patch("modules.llm_module.llm_runner.AzureChatCompletion", return_value=DummyService()), \
                 patch("modules.llm_module.llm_runner.generate_procedure", side_effect=fake_process_llm), \
                 patch("modules.llm_module.llm_runner.deduplicate_images", side_effect=fake_dedup):
                steps, imgs = llm_runner.run_llm(
                    user_prompts=user_prompts,
                    fields=fields,
                    image_paths_list=image_paths_list,
                    vectors_list=vectors_list,
                    is_auto_threshold=True,
                    download_responses=[],
                    download_response_image_paths=[],
                )
        assert steps == ["step c", "step d"]
        assert imgs == [str(img1), str(img2)]




"""LLM execution logic (OpenAI) for extracting manual steps per image."""

from __future__ import annotations

import asyncio
import base64
import json
import os
from logging import INFO, StreamHandler, getLogger
from pathlib import Path
from typing import Any

from azure.core.credentials import (
    AzureKeyCredential,
)  # noqa: F401 (retained if fallback needed)
from azure.identity import DefaultAzureCredential
from opentelemetry.trace import get_tracer
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.connectors.ai.open_ai.prompt_execution_settings.azure_chat_prompt_execution_settings import (
    AzureChatPromptExecutionSettings,
)
from semantic_kernel.contents import (
    ChatHistory,
    ChatMessageContent,
    ImageContent,
    TextContent,
)
from semantic_kernel.contents.utils.author_role import AuthorRole

from modules.image_module.image_similarity import compute_cosine_similarity
from modules.llm_module.models import (
    ImageSimilarityJudgementResponseContent,
    KeyframesManualResponseContent,
    ProcedureResponseContent,
)
from modules.llm_module.prompts import (
    IMAGE_SIMILARITY_JUDGEMENT_SYSTEM_PROMPT,
    KEYFRAMES_MANUAL_SYSTEM_PROMPT,
    PROCEDURE_SYSTEM_PROMPT,
)
from modules.utils.settings import run_telemetry_setup


class RateLimitError(Exception):
    """レート制限エラーを表す例外クラス"""
    pass


class LLMProcessingError(Exception):
    """LLM処理中のエラーを表す例外クラス"""
    pass


def _safe_truncate(text: str, max_len: int = 500) -> str:
    """ログ出力向けにテキストを安全にトリミングする関数。

    画像や巨大なテキストがログに流れ込むと可観測性が低下し、
    コスト・セキュリティ面でも望ましくありません。そのため、
    一定長で切り詰めて出力します。

    Args:
        text (str): トリミング対象の文字列
        max_len (int): 最大長

    Returns:
        str: トリミング済みの文字列（末尾に"..."を付与する場合あり）
    """
    if text is None:
        return ""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def _summarize_user_contents_for_log(user_contents: ChatMessageContent) -> str:
    """ユーザー入力（テキスト/画像）のログ用サマリーを生成する。

    - テキストは長さのみ表示（中身は出力しない）
    - 画像は件数のみ表示（パスやBase64は出力しない）
    - 予期せぬ型は型名のみ表示

    Args:
        user_contents (ChatMessageContent): チャット入力要素

    Returns:
        str: ログサマリー
    """
    summary_parts: list[str] = []
    try:
        for item in getattr(user_contents, "items", []) or []:
            # TextContent
            if isinstance(item, TextContent):
                text_len = len(getattr(item, "text", "") or "")
                summary_parts.append(f"Text(len={text_len})")
            # ImageContent（詳細は記録しない）
            elif isinstance(item, ImageContent):
                summary_parts.append("Image(omitted)")
            else:
                summary_parts.append(f"{type(item).__name__}")
    except Exception:
        # 何らかの理由でサマリー生成に失敗しても、ログ破損は避ける
        return "<summary-unavailable>"
    return " | ".join(summary_parts) if summary_parts else "<no-items>"


logger = getLogger(__name__)
handler = StreamHandler()
handler.setLevel(INFO)
logger.setLevel(INFO)
logger.addHandler(handler)
logger.propagate = False  # ルートロガー経由でのコンソール出力を遮断


def encode_image(image_path: str) -> str:
    """
    画像ファイルをBase64エンコードする関数

    Args:
        image_path (str): エンコードする画像ファイルのパス

    Returns:
        str: Base64エンコードされた画像データ
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def refine_output_text(text: str) -> str:
    """
    LLMの出力テキストを整形する関数
    整形内容：
        - "手順:"を削除
        - "1. "のみが含まれる場合、"1. "を削除

    Args:
        text (str): LLMからの出力テキスト
    Returns:
        str: 整形されたテキスト
    """
    replaced_text = text.replace("手順:", "").strip()

    if "1. " in replaced_text and "2. " not in replaced_text:
        refined_text = replaced_text.replace("1. ", "", 1).strip()
    else:
        refined_text = replaced_text
    return refined_text


async def execute_llm(
    kernel: Kernel,
    system_prompt: str,
    user_contents: ChatMessageContent,
    response_format: Any,
    assistant_prompt: str = "",
) -> str:
    """
    LLMを実行する関数

    Args:
        kernel (Kernel): Semantic Kernelインスタンス
        system_prompt (str): システムプロンプト
        user_contents (ChatMessageContent): ユーザープロンプト
        response_format (Any): 期待されるレスポンスフォーマット（※ answerを含むようにしてください。）
        assistant_prompt (str): アシスタントプロンプト（デフォルトは空文字列）

    Returns:
        str: LLMの出力テキスト
    """
    chat_completion_service: AzureChatCompletion = kernel.get_service(
        service_id="azure_openai_chat"
    )

    # Enable planning
    execution_settings = AzureChatPromptExecutionSettings()
    execution_settings.temperature = 0.0
    execution_settings.response_format = response_format

    # Create a chat history object
    chat_history = ChatHistory()
    chat_history.add_system_message(system_prompt)
    if assistant_prompt != "":
        chat_history.add_assistant_message(assistant_prompt)
    chat_history.add_message(user_contents)
    # ログ出力では生データを避け、サマリーのみを記録する
    user_summary = _summarize_user_contents_for_log(user_contents)

    max_retries = 6
    base_delay = 5
    attempt = 0
    while True:
        try:
            response = await chat_completion_service.get_chat_message_content(
                chat_history=chat_history,
                settings=execution_settings,
            )

            response_content: str = response.inner_content.choices[0].message.content  # type: ignore[union-attr]
            logger.info(
                "LLM call | prompt:%s | user:%s | resp:%s",
                _safe_truncate(system_prompt, 300),
                user_summary,
                _safe_truncate(response_content, 600),
            )

            output = json.loads(response_content)["answer"]  # type: ignore[index]
            break

        except Exception as e:
            if "429" in str(e) or "rate limit" in str(e).lower():
                attempt += 1
                if attempt > max_retries:
                    logger.error(
                        f"429レート制限が再試行上限に達しました (attempt={attempt}): {e}"
                    )
                    raise RateLimitError("一時的に動画を処理できません。時間をおいて再度お試しください。") from e
                delay = min(60, base_delay * (2 ** (attempt - 1)))
                logger.error(
                    f"429レート制限 (attempt={attempt}): {e}. retry in {delay}s"
                )
                await asyncio.sleep(delay)
                continue
            elif "content_filter" in str(e) or "ResponsibleAIPolicyViolation" in str(e):
                execution_settings.temperature += 0.2
                logger.error(
                    f"コンテンツフィルタ: {e}. temp={execution_settings.temperature}"
                )
                if execution_settings.temperature > 0.5:
                    output = ""
                    break
                await asyncio.sleep(10)
                continue
            elif "APIConnectionError" in str(e) or "Connection error" in str(e):
                attempt += 1
                if attempt > max_retries:
                    logger.error(f"接続エラーが再試行上限に達しました (attempt={attempt}): {e}")
                    raise LLMProcessingError(
                        "動画分析中に処理中に問題が発生しました。"
                    ) from e
                delay = min(60, base_delay * (2 ** (attempt - 1)))
                logger.error(f"接続エラー (attempt={attempt}): {e}. retry in {delay}s")
                await asyncio.sleep(delay)
                continue
            else:
                logger.error(f"response failed (非再試行): {e}")
                raise LLMProcessingError(
                    "動画分析中に処理中に問題が発生しました。"
                ) from e
    return output


async def generate_procedure(
    segment_idx: int,
    kernel: Kernel,
    user_prompt: str,
    field: str,
    img_paths: list[str],
) -> tuple[list[str], list[str]]:
    """
    LLMを実行して、手順書の手順を取得する関数

    Args:
        segment_idx (int): セグメントのインデックス
        kernel (Kernel): Semantic Kernelインスタンス
        user_prompt (str): ユーザープロンプト
        field (str): 補助情報
        img_paths (list[str]): 画像ファイルのパスのリスト

    Returns:
        tuple[list[str], list[str]]: 手順書の手順のリストと対応する画像ファイルのパスのリスト
    """
    output_procedure_list: list[str] = []
    output_image_path_list: list[str] = []

    tracer = get_tracer(__name__)
    with tracer.start_as_current_span(f"segment{segment_idx}"):

        for img_idx, img_path in enumerate(img_paths):
            with tracer.start_as_current_span(f"image{img_idx}") as span:
                span.set_attribute("image_path", Path(img_path).name)

                # LLMを実行して手順を取得
                extract_contents = ChatMessageContent(
                    role=AuthorRole.USER,
                    items=[
                        TextContent(
                            text=f"# 解説情報 (ユーザー)\n{user_prompt}",
                            encoding="utf-8",
                        ),
                        ImageContent.from_image_file(path=img_path),
                    ],
                )
                procedure_output = await execute_llm(
                    kernel=kernel,
                    system_prompt=f"{PROCEDURE_SYSTEM_PROMPT}\n\n# 解説情報 (LLM)\n{field}",
                    user_contents=extract_contents,
                    response_format=ProcedureResponseContent,
                )
                refined_procedure_output = refine_output_text(procedure_output)
                if not refined_procedure_output:
                    # 手順が空の場合は、出力に含めない
                    continue

                output_image_path_list.append(img_path)
                output_procedure_list.append(refined_procedure_output)

    return output_procedure_list, output_image_path_list


async def deduplicate_images(
    img_idx: int,
    kernel: Kernel,
    pre_img_sets: tuple[int, str, list[float]],
    current_img_sets: tuple[int, str, list[float]],
) -> tuple[int, str, list[float]] | None:
    """
    前後画像ペアを比較し重複と判定された場合、前画像情報を返す（削除対象）。

    Args:
        img_idx (int): 画像ペアのインデックス
        kernel (Kernel): Semantic Kernelインスタンス
        pre_img_sets (tuple[int, str, list[float]]): 前画像の情報 (セグメントインデックス, 画像パス, ベクトル)
        current_img_sets (tuple[int, str, list[float]]): 現画像の情報 (セグメントインデックス, 画像パス, ベクトル)

    Returns:
        (seg_idx, img_path, vector) | None
    """
    tracer = get_tracer(__name__)
    pre_seg_idx, pre_img_path, pre_vector = pre_img_sets
    _, img_path, vector = current_img_sets
    with tracer.start_as_current_span(f"dup_image{img_idx}") as span:
        span.set_attribute("pre_image", Path(pre_img_path).name)
        span.set_attribute("current_image", Path(img_path).name)

        cosine_similarity = compute_cosine_similarity(pre_vector, vector)
        duplicate_contents = ChatMessageContent(
            role=AuthorRole.USER,
            items=[
                TextContent(
                    text=f"# 画像類似度: {cosine_similarity}", encoding="utf-8"
                ),
                ImageContent.from_image_file(path=pre_img_path),
                ImageContent.from_image_file(path=img_path),
            ],
        )
        dup_output = await execute_llm(
            kernel=kernel,
            system_prompt=IMAGE_SIMILARITY_JUDGEMENT_SYSTEM_PROMPT,
            user_contents=duplicate_contents,
            response_format=ImageSimilarityJudgementResponseContent,
        )
        if "1" in dup_output:
            return pre_seg_idx, pre_img_path, pre_vector
        return None


def run_llm(
    user_prompts: list[list[str]],
    fields: list[str],
    image_paths_list: list[list[str]],
    vectors_list: list[list[list[float]]],
    is_auto_threshold: bool,
) -> tuple[list[str], list[str]]:
    """
    LLMを並列実行して、手順書の手順と画像を取得する関数

    Args:
        user_prompts (list[list[str]]): ユーザープロンプトのリスト
        fields (list[str]): 補助情報のリスト
        image_paths_list (list[list[str]]): 画像ファイルのパスのリストのリスト
        vectors_list (list[list[list[float]]]): 画像のベクトルのリストのリスト
        is_auto_threshold (bool): 類似度に基づく自動フィルタリングを有効にするかどうか

    Returns:
        tuple[list[str], list[str]]: 手順書の手順のリストと対応する画像ファイルのパスのリスト
    """
    model_name = os.environ.get("AZURE_OPENAI_MODEL_NAME")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION")
    azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    # Managed Identity 利用: APIキーではなく AAD トークンを使用
    api_key = os.environ.get(
        "AZURE_OPENAI_API_KEY"
    )  # 互換性のため残す（存在すれば優先）
    application_insights_connection_string = os.environ.get(
        "APPLICATIONINSIGHTS_CONNECTION_STRING"
    )

    if model_name is None:
        raise ValueError("AZURE_OPENAI_MODEL_NAME environment variable is not set")
    if api_version is None:
        raise ValueError("AZURE_OPENAI_API_VERSION environment variable is not set")
    if azure_endpoint is None:
        raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is not set")
    token: str | None = None
    if api_key is None:
        credential = DefaultAzureCredential()
        # Azure OpenAI リソースのスコープは https://cognitiveservices.azure.com/.default
        token = credential.get_token("https://cognitiveservices.azure.com/.default").token  # type: ignore[assignment]
    if application_insights_connection_string is None:
        raise ValueError(
            "APPLICATIONINSIGHTS_CONNECTION_STRING environment variable is not set"
        )

    # Initialize the kernel
    kernel = Kernel()

    # Add Azure OpenAI chat completion
    if api_key:
        # 従来のキー認証（後方互換）
        chat_completion = AzureChatCompletion(
            deployment_name=model_name,
            api_key=api_key,
            endpoint=azure_endpoint,
            api_version=api_version,
            service_id="azure_openai_chat",
        )
    else:
        # Managed Identity トークン認証
        chat_completion = AzureChatCompletion(
            deployment_name=model_name,
            api_key=token,  # ライブラリはapi_keyパラメータしか受け付けないためトークンを渡す
            endpoint=azure_endpoint,
            api_version=api_version,
            service_id="azure_openai_chat",
        )
    kernel.add_service(chat_completion)

    # user_promptsを拡張し、次のセグメントの内容を含める
    augmented_user_prompts: list[str] = []
    if user_prompts:
        for i, prompts in enumerate(user_prompts):
            parts: list[str] = []
            for prompt in prompts:
                parts.append(prompt)
            if i < len(user_prompts) - 1:
                for next_prompt in user_prompts[i + 1]:
                    # 異なる内容のみ追加
                    if next_prompt not in parts:
                        parts.append(next_prompt)
            augmented_user_prompts.append("\n".join(parts))

    flat_img_list: list[tuple[int, str, list[float]]] = []
    for seg_idx, (paths, vecs) in enumerate(zip(image_paths_list, vectors_list)):
        for p, v in zip(paths, vecs):
            flat_img_list.append((seg_idx, p, v))

    pair_img_flat_list: list[
        tuple[tuple[int, str, list[float]], tuple[int, str, list[float]]]
    ] = []
    for i in range(len(flat_img_list) - 1):
        pair_img_flat_list.append((flat_img_list[i], flat_img_list[i + 1]))

    async def _deduplicate_image_pairs() -> None:
        """画像ペアを比較し、重複と判定された前画像を削除する非同期関数"""
        tasks = [
            asyncio.create_task(
                deduplicate_images(
                    img_idx,
                    kernel,
                    img1_sets,
                    img2_sets,
                )
            )
            for img_idx, (img1_sets, img2_sets) in enumerate(pair_img_flat_list)
        ]
        results = await asyncio.gather(*tasks)
        # 重複と判定された前画像を削除
        for res in results:
            if res is None:
                continue
            seg_idx, img_path, _ = res

            remove_img_idx = image_paths_list[seg_idx].index(img_path)
            image_paths_list[seg_idx].pop(remove_img_idx)

    async def _generate_texts() -> tuple[list[str], list[str]]:
        """LLMから手順を取得し、結果を集約する非同期関数"""
        responses: list[str] = []
        responses_image_paths: list[str] = []

        tasks = [
            asyncio.create_task(
                generate_procedure(
                    idx,
                    kernel,
                    user_prompt,
                    field,
                    img_paths,
                )
            )
            for idx, (user_prompt, field, img_paths) in enumerate(
                zip(augmented_user_prompts, fields, image_paths_list)
            )
        ]
        # Results correspond index-wise to the original input ordering.
        results = await asyncio.gather(*tasks)
        for manual_processes_output, img_paths in results:
            responses.extend(manual_processes_output)
            responses_image_paths.extend(img_paths)
        return responses, responses_image_paths

    # Start the trace (conditionally)
    run_telemetry_setup(application_insights_connection_string)  # type: ignore[arg-type]
    tracer = get_tracer(__name__)

    with tracer.start_as_current_span("main"):
        with tracer.start_as_current_span("deduplicate_image_pairs"):
            if is_auto_threshold is True:
                asyncio.run(_deduplicate_image_pairs())
        responses, responses_image_paths = asyncio.run(_generate_texts())

    return responses, responses_image_paths


def describe_keyframes(image_paths: list[str], batch_size: int = 10) -> list[tuple[str, bool, str]]:
    """
    キーフレーム画像群からマニュアル手順をLLMで一括生成する関数
    10枚以上の場合はバッチ処理してマージする

    Args:
        image_paths (list[str]): 画像ファイルのパスのリスト
        batch_size (int): 1回のLLMリクエストで処理する最大画像数（デフォルト10、Azure OpenAIの上限）

    Returns:
        list[tuple[str, bool, str]]: 各画像の(説明文, スキップフラグ, スキップ理由)のタプルリスト
    """
    if not image_paths:
        return []
    
    # バッチに分割
    batches = [image_paths[i:i + batch_size] for i in range(0, len(image_paths), batch_size)]
    logger.info(f"describe_keyframes: {len(image_paths)}枚を{len(batches)}バッチに分割 (batch_size={batch_size})")
    
    model_name = os.environ.get("AZURE_OPENAI_MODEL_NAME")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION")
    azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    application_insights_connection_string = os.environ.get(
        "APPLICATIONINSIGHTS_CONNECTION_STRING"
    )

    if model_name is None:
        raise ValueError("AZURE_OPENAI_MODEL_NAME environment variable is not set")
    if api_version is None:
        raise ValueError("AZURE_OPENAI_API_VERSION environment variable is not set")
    if azure_endpoint is None:
        raise ValueError("AZURE_OPENAI_ENDPOINT environment variable is not set")
    
    token: str | None = None
    if api_key is None:
        credential = DefaultAzureCredential()
        token = credential.get_token("https://cognitiveservices.azure.com/.default").token

    # Initialize the kernel
    kernel = Kernel()

    # Add Azure OpenAI chat completion
    if api_key:
        chat_completion = AzureChatCompletion(
            deployment_name=model_name,
            api_key=api_key,
            endpoint=azure_endpoint,
            api_version=api_version,
            service_id="azure_openai_chat",
        )
    else:
        chat_completion = AzureChatCompletion(
            deployment_name=model_name,
            api_key=token,
            endpoint=azure_endpoint,
            api_version=api_version,
            service_id="azure_openai_chat",
        )
    kernel.add_service(chat_completion)

    async def _process_single_batch(batch_paths: list[str], batch_index: int, global_start_index: int) -> list[tuple[str, bool, str]]:
        """単一バッチの画像をLLMで処理する非同期関数"""
        # ユーザーメッセージに全画像を添付
        items: list[Any] = [
            TextContent(
                text=f"以下の{len(batch_paths)}枚のキーフレーム画像から、マニュアル手順を作成してください。画像は順番に並んでいます。",
                encoding="utf-8"
            ),
        ]
        for idx, img_path in enumerate(batch_paths):
            items.append(TextContent(text=f"\n--- 画像 {idx + 1} ---", encoding="utf-8"))
            items.append(ImageContent.from_image_file(path=img_path))
        
        contents = ChatMessageContent(
            role=AuthorRole.USER,
            items=items,
        )
        
        chat_completion_service: AzureChatCompletion = kernel.get_service(
            service_id="azure_openai_chat"
        )
        execution_settings = AzureChatPromptExecutionSettings()
        execution_settings.temperature = 0.0
        execution_settings.response_format = KeyframesManualResponseContent

        chat_history = ChatHistory()
        chat_history.add_system_message(KEYFRAMES_MANUAL_SYSTEM_PROMPT)
        chat_history.add_message(contents)

        max_retries = 6
        base_delay = 5
        attempt = 0
        
        while True:
            try:
                response = await chat_completion_service.get_chat_message_content(
                    chat_history=chat_history,
                    settings=execution_settings,
                )
                response_content: str = response.inner_content.choices[0].message.content  # type: ignore[union-attr]
                logger.info(f"LLM keyframes batch {batch_index + 1} response: {_safe_truncate(response_content, 600)}")
                
                parsed = json.loads(response_content)
                steps = parsed.get("steps", [])
                
                # インデックス順にソートして(説明, skip, skip_reason)のタプルを返す
                sorted_steps = sorted(steps, key=lambda x: x.get("index", 0))
                results: list[tuple[str, bool, str]] = [
                    (
                        step.get("description", f"ステップ {global_start_index + i + 1}"),
                        step.get("skip", False),
                        step.get("skip_reason", "")
                    )
                    for i, step in enumerate(sorted_steps)
                ]
                
                # 画像数と説明数が一致しない場合は補完
                while len(results) < len(batch_paths):
                    results.append((f"ステップ {global_start_index + len(results) + 1}", False, ""))
                
                return results[:len(batch_paths)]
                
            except Exception as e:
                if "429" in str(e) or "rate limit" in str(e).lower():
                    attempt += 1
                    if attempt > max_retries:
                        logger.error(f"429レート制限が再試行上限に達しました (batch {batch_index + 1}): {e}")
                        raise RateLimitError("一時的に処理できません。時間をおいて再度お試しください。") from e
                    delay = min(60, base_delay * (2 ** (attempt - 1)))
                    logger.error(f"429レート制限 batch {batch_index + 1} (attempt={attempt}): {e}. retry in {delay}s")
                    await asyncio.sleep(delay)
                    continue
                else:
                    logger.error(f"LLM keyframes batch {batch_index + 1} error: {e}")
                    # フォールバック: プレースホルダーの説明を返す（スキップなし）
                    return [(f"ステップ {global_start_index + i + 1}", False, "") for i in range(len(batch_paths))]

    async def _generate_manual_from_keyframes() -> list[tuple[str, bool, str]]:
        """全キーフレーム画像をバッチ処理してマニュアルを生成する非同期関数"""
        all_results: list[tuple[str, bool, str]] = []
        
        for batch_index, batch_paths in enumerate(batches):
            global_start_index = batch_index * batch_size
            logger.info(f"Processing batch {batch_index + 1}/{len(batches)} ({len(batch_paths)} images)")
            
            batch_results = await _process_single_batch(batch_paths, batch_index, global_start_index)
            all_results.extend(batch_results)
            
            # バッチ間にレート制限回避のための待機（最後のバッチ以外）
            if batch_index < len(batches) - 1:
                logger.info(f"Waiting 2s before next batch to avoid rate limits...")
                await asyncio.sleep(2)
        
        return all_results

    # Start the trace (conditionally)
    if application_insights_connection_string:
        run_telemetry_setup(application_insights_connection_string)
    
    tracer = get_tracer(__name__)
    with tracer.start_as_current_span("describe_keyframes"):
        results = asyncio.run(_generate_manual_from_keyframes())

    return results

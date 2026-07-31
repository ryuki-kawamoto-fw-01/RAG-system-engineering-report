from enum import Enum

"""ロギングシステムで使用されるタグと分類の定義
このモジュールは、アプリケーション全体で使用されるロギングタグと
それらのグループ分けを定義します。
"""


class LogTag(Enum):
    """ロギングで使用される個別のタグを定義するEnum"""

    # 基本タグ
    CHAT = "chat"  # チャットに関連するログ
    GENERATION = "generation"  # コンテンツ生成に関連するログ
    FUNCTION_CALLING = "function_calling"  # 関数呼び出しに関連するログ
    RERANK = "rerank"  # 再ランク付けに関連するログ
    TOOL = "tool"  # ツール使用に関連するログ
    PROMPTS = "prompts"  # プロンプトに関連するログ
    JSON_SCHEME = "json_scheme"  # JSONスキーマに関連するログ
    TEXT = "text"  # テキスト処理に関連するログ
    WEB_SEARCH = "web_search"  # Web検索に関連するログ
    KEY_VARIATION = "key_variation"  # キーワードバリエーションに関連するログ
    RETRIEVE_CONTEXT = "retrieve_context"  # コンテキスト取得に関連するログ
    RERANK_SEARCH_RESULT = (
        "rerank_search_result"  # 検索結果の再ランク付けに関連するログ
    )
    LLM = "llm"  # LLMの操作に関連するログ


# タググループの定義
TAG_GROUPS: dict[str, list[str]] = {
    "CHAT": [
        LogTag.CHAT.value,
        LogTag.GENERATION.value,
        LogTag.TEXT.value,
        LogTag.FUNCTION_CALLING.value,
        LogTag.LLM.value,
    ],
    "WEB_SEARCH": [LogTag.TOOL.value, LogTag.WEB_SEARCH.value],
    "RERANK": [
        LogTag.RERANK.value,
        LogTag.GENERATION.value,
        LogTag.JSON_SCHEME.value,
        LogTag.RERANK_SEARCH_RESULT.value,
    ],
    "KEYWORD_VARIATION": [
        LogTag.LLM.value,
        LogTag.GENERATION.value,
        LogTag.JSON_SCHEME.value,
        LogTag.WEB_SEARCH.value,
        LogTag.KEY_VARIATION.value,
    ],
    "RETRIEVE_CONTEXT": [
        LogTag.LLM.value,
        LogTag.GENERATION.value,
        LogTag.WEB_SEARCH.value,
        LogTag.TEXT.value,
        LogTag.RETRIEVE_CONTEXT.value,
    ],
    "RERANK_SEARCH_RESULT": [
        LogTag.LLM.value,
        LogTag.GENERATION.value,
        LogTag.WEB_SEARCH.value,
        LogTag.JSON_SCHEME.value,
        LogTag.RERANK_SEARCH_RESULT.value,
    ],
    "CREATE_SEARCH_KEYWORD_VARIATION_PROMPT": [
        LogTag.PROMPTS.value,
        LogTag.WEB_SEARCH.value,
        LogTag.KEY_VARIATION.value,
        LogTag.LLM.value,
    ],
}

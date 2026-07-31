import os
import base64
import logging
from typing import List, Callable, Set, Optional

from azure.ai.inference.models import ChatCompletionsToolCall, FunctionCall
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from openai import AzureOpenAI

from modules.service import ILLMService, IStorageService, IWordDictionaryService
from modules.use_case import PlanningUseCase, ToolUseUseCase, MergeUseCase
from modules.agent.model import (
    AISearchSegment,
    Citation,
    AISearchResponse,
    AIChatResponse,
)
from modules.agent.prompt import RESEARCHER_SYSTEM_PROMPT, REVIEWER_SYSTEM_PROMPT

# インデックス用フィールド
DOCUMENT_CONTENT_FIELD = "chunk"
DOCUMENT_PATH_FIELD = "source_file_path"
DOCUMENT_SPLIT_FILEPATH_FIELD = "split_file_path"
DOCUMENT_DESCRIPTION_FILED = "description"


def format_search_result(search_results) -> List[AISearchSegment]:
    segments = []
    for idx, result in enumerate(search_results, start=1):
        content = result[DOCUMENT_CONTENT_FIELD]
        path = result[DOCUMENT_PATH_FIELD]
        split_file_path = result[DOCUMENT_SPLIT_FILEPATH_FIELD]
        title = os.path.basename(path)
        logging.info("title%d: %s", idx, title)
        seg = AISearchSegment(
            text=content,
            citation=[
                Citation(
                    search_title=title,
                    search_path=path,
                    split_file_path=split_file_path,
                )
            ],
        )
        segments.append(seg)
    logging.info("Total files processed: %d", len(segments))
    return segments


class KeywordSearchTool:

    def __init__(
        self,
        search_client: SearchClient,
        search_count: int,
        file_prefix: Optional[str] = None,
        scoring_profile_chunk: Optional[str] = None,
        scoring_profile_filepath: Optional[str] = None,
    ):
        self.search_client = search_client
        self.search_count = search_count
        self.file_prefix = file_prefix
        self.scoring_profile_chunk = scoring_profile_chunk
        self.scoring_profile_filepath = scoring_profile_filepath

    # descは関数の処理内で使わないが、LLMが出力した関数呼び出しの結果から読み取る。
    def keyword_search(self, query: str, desc: str) -> str:
        """
        キーワード検索を行います。単純なキーワード検索ではなく高度な検索も可能です。

        :param query: 検索キーワードです。検索エンジンのキーワードをイメージしてください。キーワードは必ず1単語もしくは2単語までにしてください。例：「手順計画 規格」
        :param desc: ユーザーに説明するメッセージです。意図を説明してキーワード検索とqueryも明示して。queryは「」で囲って

        :return: キーワード検索の結果をJSON形式で出力
        :rtype: AISearchResponse
        """

        logging.info(f"[キーワード検索] クエリ: {query}")
        search_options = {
            "select": [
                DOCUMENT_CONTENT_FIELD,
                DOCUMENT_PATH_FIELD,
                DOCUMENT_SPLIT_FILEPATH_FIELD,
            ],
            "search_fields": [
                DOCUMENT_CONTENT_FIELD,
                DOCUMENT_PATH_FIELD,
                DOCUMENT_DESCRIPTION_FILED,
            ],
            "search_mode": "all",  # AND検索
            "top": self.search_count,
        }
        if self.file_prefix:
            search_options["filter"] = (
                f"search.ismatch('^{self.file_prefix}', '{DOCUMENT_PATH_FIELD}', 'simple', 'all')"
            )

        # スコアリングプロファイルの有無で分岐
        search_results = []
        profiles = []
        if self.scoring_profile_chunk:
            profiles.append(self.scoring_profile_chunk)
        if self.scoring_profile_filepath:
            profiles.append(self.scoring_profile_filepath)
        if not profiles:
            # スコアリングプロファイリングの指定がなければで1回だけ検索
            search_results = list(
                self.search_client.search(
                    query,
                    **search_options,
                )
            )
        else:
            for profile in profiles:
                search_results += list(
                    self.search_client.search(
                        query,
                        **search_options,
                        scoring_profile=profile,
                    )
                )
        logging.info(f"[キーワード検索] ヒット件数: {len(search_results)}")
        for idx, result in enumerate(search_results, start=1):
            logging.info(
                f"[キーワード検索] チャンク{idx}: ファイル名: {result[DOCUMENT_SPLIT_FILEPATH_FIELD]} チャンク: {result[DOCUMENT_CONTENT_FIELD]}"
            )
        segments = format_search_result(search_results)

        return AISearchResponse(segments=segments).model_dump_json()


class SemanticSearchTool:
    DOCUMENT_VECTOR_FIELD = "vector"

    def __init__(
        self,
        semantic_config: str,
        embedding_model: str,
        search_client: SearchClient,
        aoai_client: AzureOpenAI,
        search_count: int,
        file_prefix: Optional[str] = None,
        scoring_profile_chunk: Optional[str] = None,
        scoring_profile_filepath: Optional[str] = None,
    ):
        self.search_client = search_client
        self.semantic_config = semantic_config
        self.embedding_model = embedding_model
        self.aoai_client = aoai_client
        self.search_count = search_count
        self.file_prefix = file_prefix
        self.scoring_profile_chunk = scoring_profile_chunk
        self.scoring_profile_filepath = scoring_profile_filepath

    # descは関数の処理内で使わないが、LLMが出力した関数呼び出しの結果から読み取る。
    def semantic_search(self, query: str, desc: str) -> str:
        """
        検索クエリをベクトル空間に埋め込んで文書のベクトル群から意味の近い文書をk近傍法で選んで回答します。
        またBing検索で使われているセマンティックアルゴリズムも採用することで高度な検索を行います。

        :param query: 検索クエリ
        :param desc: ユーザーに説明するメッセージです。意図を説明してセマンティック検索とqueryも明示して。queryは「」で囲って

        :return: セマンティック検索の結果をJSON形式で出力
        :rtype: str
        """
        logging.info(f"[セマンティック検索] クエリ: {query}")
        embedding_response = self.aoai_client.embeddings.create(
            input=[query],
            model=self.embedding_model,
        )
        embedding_vector = embedding_response.data[0].embedding

        search_options = {
            "top": self.search_count,
            "select": [
                DOCUMENT_CONTENT_FIELD,
                DOCUMENT_PATH_FIELD,
                DOCUMENT_SPLIT_FILEPATH_FIELD,
            ],
            "search_fields": [
                DOCUMENT_CONTENT_FIELD,
                DOCUMENT_PATH_FIELD,
                DOCUMENT_DESCRIPTION_FILED,
            ],
            "query_type": "semantic",
            "semantic_configuration_name": self.semantic_config,
            "vector_queries": [
                VectorizedQuery(
                    vector=embedding_vector,
                    k_nearest_neighbors=self.search_count,
                    fields=self.DOCUMENT_VECTOR_FIELD,
                )
            ],
        }
        if self.file_prefix:
            search_options["filter"] = (
                f"search.ismatch('^{self.file_prefix}', '{DOCUMENT_PATH_FIELD}', 'simple', 'all')"
            )

        search_results = []
        profiles = []
        if self.scoring_profile_chunk:
            profiles.append(self.scoring_profile_chunk)
        if self.scoring_profile_filepath:
            profiles.append(self.scoring_profile_filepath)
        if not profiles:
            # スコアリングプロファイリングの指定がなければで1回だけ検索
            search_results = list(
                self.search_client.search(
                    query,
                    **search_options,
                )
            )
        else:
            for profile in profiles:
                search_results += list(
                    self.search_client.search(
                        query,
                        **search_options,
                        scoring_profile=profile,
                    )
                )
        logging.info(f"[セマンティック検索] ヒット件数: {len(search_results)}")
        for idx, result in enumerate(search_results, start=1):
            logging.info(
                f"[セマンティック検索] チャンク{idx}: ファイル名: {result[DOCUMENT_SPLIT_FILEPATH_FIELD]} チャンク: {result[DOCUMENT_CONTENT_FIELD]}"
            )
        segments = format_search_result(search_results)

        return AISearchResponse(segments=segments).model_dump_json()


class AgentTool:

    def __init__(
        self,
        system_prompt: str,
        llm_service: ILLMService,
        tempfile_storage: IStorageService,
        word_dictionary_db: IWordDictionaryService,
        tools: Set[Callable],
    ):
        self.system_prompt = system_prompt
        self.llm_service = llm_service
        self.tools = tools
        self.planning = PlanningUseCase(
            llm=llm_service,
            storage=tempfile_storage,
            word_dictionary_db=word_dictionary_db,
            user_functions=tools,
            system_prompt=system_prompt,
        )
        self.tool_use = ToolUseUseCase(
            user_functions=tools,
        )
        self.merge = MergeUseCase(
            llm=llm_service,
        )
        self.messages = []

    def _chat(self, query: str, desc: str) -> str:

        planning_res = self.planning.execute(
            question=query,
            messages=self.messages,
            file_name=None,
            media_type=None,
        )
        self.messages = planning_res["messages"]

        tool_calls = [
            ChatCompletionsToolCall(
                id=t["id"],
                function=FunctionCall(
                    name=t["function"]["name"], arguments=t["function"]["arguments"]
                ),
            )
            for t in planning_res["plan"]
        ]

        if tool_calls:
            tool_use_res = self.tool_use.execute(
                messages=self.messages, tool_calls=tool_calls
            )
            self.messages = tool_use_res["messages"]
            merge_res = self.merge.execute(
                messages=self.messages,
                user_message_rev=planning_res["user_message_rev"],
            )
            self.messages = merge_res["messages"]
            return AIChatResponse(answer=merge_res["answer"]).model_dump_json()
        if planning_res["content"]:
            return AIChatResponse(answer=planning_res["content"]).model_dump_json()
        return AIChatResponse(answer="失敗しました").model_dump_json()


class ResearchAgentTool(AgentTool):

    def __init__(
        self,
        llm_service: ILLMService,
        tempfile_storage: IStorageService,
        tools: Set[Callable],
    ):
        super().__init__(
            RESEARCHER_SYSTEM_PROMPT,
            llm_service,
            tempfile_storage,
            tools,
        )

    def research_chat(self, query: str, desc: str) -> str:
        """
        AgentToolのエントリーポイントです。

        query: エージェントへの依頼内容
        desc: 次の形式で「リサーチエージェントへの問い合わせ: <エージェントへの依頼内容の意図>」
        """
        return self._chat(query, desc)


class ReviewAgentTool(AgentTool):

    def __init__(
        self,
        llm_service: ILLMService,
        tempfile_storage: IStorageService,
        tools: Set[Callable],
    ):
        super().__init__(
            REVIEWER_SYSTEM_PROMPT,
            llm_service,
            tempfile_storage,
            tools,
        )

    def review_chat(self, query: str, desc: str) -> str:
        """
        AgentToolのエントリーポイントです。

        query: エージェントへの依頼内容
        desc: 次の形式で「レビューエージェントへの問い合わせ: <エージェントへの依頼内容の意図>」
        """
        return self._chat(query, desc)

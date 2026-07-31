import logging
import os
from typing import Callable, Optional, Set

from azure.ai.projects import AIProjectClient
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from azure.search.documents import SearchClient
from openai import AzureOpenAI

from modules.agent.tool import (
    KeywordSearchTool,
    ResearchAgentTool,
    ReviewAgentTool,
    SemanticSearchTool,
)
from modules.const import (
    AZURE_AI_FOUNDRY_PROJECT_ENDPOINT_ENV_KEY,
    AZURE_AISEARCH_ENDPOINT_ENV_KEY,
    AZURE_OPENAI_ENDPOINT_ENV_KEY,
    AZURE_OPENAI_VERSION_ENV_KEY,
    AZURE_STORAGE_CONNECTION_STRING_ENV_KEY,
    AZURE_STORAGE_MARKDOWN_CONTAINER_ENV_KEY,
    AZURE_STORAGE_SPLIT_CONTAINER_ENV_KEY,
    AZURE_STORAGE_SRC_CONTAINER_ENV_KEY,
    AZURE_STORAGE_TEMPFILE_CONNECTION_STRING_ENV_KEY,
    AZURE_STORAGE_TEMPFILE_CONTAINER_NAME_ENV_KEY,
    DEFAULT_CATEGORY_ENV_KEY,
    EMBEDDING_MODEL_ENV_KEY,
    KEYWORD_SEARCH_COUNT_ENV_KEY,
    SCORING_PROFILE_CHUNK_ENV_KEY,
    SCORING_PROFILE_FILEPATH_ENV_KEY,
    SEMANTIC_SEARCH_CONFIG_ENV_KEY,
    SEMANTIC_SEARCH_COUNT_ENV_KEY,
)
from modules.service import (
    AzureInferenceLLMService,
    AzureStorageService,
    CosmosDBWordDictionaryService,
    InferenceLLMService,
)
from modules.use_case import (
    MergeUseCase,
    PdfToImagePromptUseCase,
    PlanningUseCase,
    ReflectionUseCase,
    ToolUseUseCase,
)


class DIContainer:
    _instance = None
    _services = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DIContainer, cls).__new__(cls)
        return cls._instance

    def _get_env(self, key: str, default: Optional[str] = None) -> str:
        """環境変数を取得し、存在しない場合はエラーを発生させる"""
        value = os.environ.get(key, default)
        if value is None:
            logging.error(f"環境変数 {key} が設定されていません")
            raise Exception(f"環境変数 {key} が設定されていません")
        return value

    @property
    def credential(self):
        """DefaultAzureCredentialを取得"""
        if "credential" not in self._services:
            self._services["credential"] = DefaultAzureCredential()
        return self._services["credential"]

    @property
    def token_provider(self):
        """トークンプロバイダーを取得"""
        if "token_provider" not in self._services:
            self._services["token_provider"] = get_bearer_token_provider(
                self.credential, "https://cognitiveservices.azure.com/.default"
            )
        return self._services["token_provider"]

    @property
    def aoai_client(self):
        """AzureOpenAIクライアントを取得"""
        if "aoai_client" not in self._services:
            self._services["aoai_client"] = AzureOpenAI(
                azure_endpoint=self._get_env(AZURE_OPENAI_ENDPOINT_ENV_KEY),
                azure_ad_token_provider=self.token_provider,
                api_version=self._get_env(AZURE_OPENAI_VERSION_ENV_KEY),
            )
        return self._services["aoai_client"]

    @property
    def agent_project_client(self):
        """AIProjectClientを取得"""
        if "agent_project_client" not in self._services:
            self._services["agent_project_client"] = AIProjectClient(
                endpoint=self._get_env(AZURE_AI_FOUNDRY_PROJECT_ENDPOINT_ENV_KEY),
                credential=self.credential,
            )
        return self._services["agent_project_client"]

    @property
    def word_dictionary_cosmosdb(self):
        """CosmosDBから辞書データを取得"""
        if "word_dictionary_cosmosdb" not in self._services:
            client = CosmosClient(
                url=self._get_env("AZURE_COSMOSDB_URI"), credential=self.credential
            )
            database = client.get_database_client(
                self._get_env("AZURE_COSMOSDB_DATABASE_NAME")
            )
            container = database.get_container_client("dictionary")
            self._services["word_dictionary_cosmosdb"] = container
        return self._services["word_dictionary_cosmosdb"]

    @property
    def search_client(self):
        """デフォルトカテゴリの検索クライアントを取得"""
        return SearchClient(
            endpoint=self._get_env(AZURE_AISEARCH_ENDPOINT_ENV_KEY),
            index_name=self._get_env(DEFAULT_CATEGORY_ENV_KEY),
            credential=self.credential,
        )

    # Service

    @property
    def srcfile_storage(self):
        """AzureStorageService(src)を取得"""
        if "srcfile_storage" not in self._services:
            self._services["srcfile_storage"] = AzureStorageService(
                DefaultAzureCredential(),
                self._get_env(AZURE_STORAGE_CONNECTION_STRING_ENV_KEY),
                self._get_env(AZURE_STORAGE_SRC_CONTAINER_ENV_KEY),
            )
        return self._services["srcfile_storage"]

    @property
    def split_file_storage(self):
        """AzureStorageService(split)を取得"""
        if "split_file_storage" not in self._services:
            self._services["split_file_storage"] = AzureStorageService(
                DefaultAzureCredential(),
                self._get_env(AZURE_STORAGE_CONNECTION_STRING_ENV_KEY),
                self._get_env(AZURE_STORAGE_SPLIT_CONTAINER_ENV_KEY),
            )
        return self._services["split_file_storage"]

    @property
    def markdown_storage(self):
        """AzureStorageService(markdown)を取得"""
        if "markdown_storage" not in self._services:
            self._services["markdown_storage"] = AzureStorageService(
                DefaultAzureCredential(),
                self._get_env(AZURE_STORAGE_CONNECTION_STRING_ENV_KEY),
                self._get_env(AZURE_STORAGE_MARKDOWN_CONTAINER_ENV_KEY),
            )
        return self._services["markdown_storage"]

    @property
    def tempfile_storage(self):
        """AzureStorageService(tempfile)を取得"""
        if "tempfile_storage" not in self._services:
            self._services["tempfile_storage"] = AzureStorageService(
                DefaultAzureCredential(),
                self._get_env(AZURE_STORAGE_TEMPFILE_CONNECTION_STRING_ENV_KEY),
                self._get_env(AZURE_STORAGE_TEMPFILE_CONTAINER_NAME_ENV_KEY),
            )
        return self._services["tempfile_storage"]

    def get_inference_llm_service(self, model: str) -> InferenceLLMService:
        """InferenceLLMServiceのインスタンスを取得"""
        return InferenceLLMService(self.agent_project_client, model)

    def get_azure_inference_llm_service(self, model: str) -> AzureInferenceLLMService:
        """InferenceLLMServiceのインスタンスを取得"""
        return AzureInferenceLLMService(self.agent_project_client, model)

    def get_planning_use_case(
        self,
        model: str,
        task: str,
        system_prompt: str,
        file_prefix: Optional[str] = None,
    ) -> PlanningUseCase:
        """PlanningUseCaseのインスタンスを取得"""
        return PlanningUseCase(
            llm=self.get_inference_llm_service(model),
            word_dictionary_db=self.word_dictionary_db,
            storage=self.tempfile_storage,
            user_functions=self.get_user_functions(task, model, file_prefix),
            system_prompt=system_prompt,
        )

    def get_tool_use_use_case(
        self, task: str, model: str, file_prefix: Optional[str] = None
    ) -> ToolUseUseCase:
        """ToolUseUseCaseのインスタンスを取得"""
        return ToolUseUseCase(
            user_functions=self.get_user_functions(task, model, file_prefix)
        )

    def get_reflection_use_case(self, model: str, task: str) -> ReflectionUseCase:
        """ReflectionUseCaseのインスタンスを取得"""
        return ReflectionUseCase(
            llm=self.get_azure_inference_llm_service(model),
            user_functions=self.get_user_functions(task, model),
        )

    def get_merge_use_case(self, model: str) -> MergeUseCase:
        """MergeUseCaseのインスタンスを取得"""
        return MergeUseCase(llm=self.get_azure_inference_llm_service(model))

    @property
    def word_dictionary_db(self):
        """CosmosDBWordDictionaryServiceを取得"""
        if "word_dictionary_db" not in self._services:
            self._services["word_dictionary_db"] = CosmosDBWordDictionaryService(
                self.word_dictionary_cosmosdb
            )
        return self._services["word_dictionary_db"]

    def get_pdf_to_image_prompt_use_case(self) -> PdfToImagePromptUseCase:
        """PdfToImagePromptUseCaseを取得"""
        return PdfToImagePromptUseCase(storage=self.split_file_storage)

    # AGENT TOOL

    def get_keyword_search_tool(
        self, file_prefix: Optional[str] = None
    ) -> KeywordSearchTool:
        scoring_profile_chunk = self._get_env(SCORING_PROFILE_CHUNK_ENV_KEY, "")
        scoring_profile_filepath = self._get_env(SCORING_PROFILE_FILEPATH_ENV_KEY, "")
        return KeywordSearchTool(
            search_client=self.search_client,
            search_count=int(self._get_env(KEYWORD_SEARCH_COUNT_ENV_KEY, "5")),
            file_prefix=file_prefix,
            scoring_profile_chunk=scoring_profile_chunk,
            scoring_profile_filepath=scoring_profile_filepath,
        )

    def get_semantic_search_tool(
        self, file_prefix: Optional[str] = None
    ) -> SemanticSearchTool:
        scoring_profile_chunk = self._get_env(SCORING_PROFILE_CHUNK_ENV_KEY, "")
        scoring_profile_filepath = self._get_env(SCORING_PROFILE_FILEPATH_ENV_KEY, "")
        return SemanticSearchTool(
            semantic_config=self._get_env(SEMANTIC_SEARCH_CONFIG_ENV_KEY),
            embedding_model=self._get_env(EMBEDDING_MODEL_ENV_KEY),
            aoai_client=self.aoai_client,
            search_client=self.search_client,
            search_count=int(self._get_env(SEMANTIC_SEARCH_COUNT_ENV_KEY, "3")),
            file_prefix=file_prefix,
            scoring_profile_chunk=scoring_profile_chunk,
            scoring_profile_filepath=scoring_profile_filepath,
        )

    def get_research_agent_tool(
        self, model: str, tools: Set[Callable]
    ) -> ResearchAgentTool:
        return ResearchAgentTool(
            llm_service=self.get_inference_llm_service(model),
            tempfile_storage=self.tempfile_storage,
            tools=tools,
        )

    # def get_review_agent_tool(self, model: str) -> ReviewAgentTool:
    #     return ReviewAgentTool(
    #         llm_service=self.get_inference_llm_service(model),
    #         tempfile_storage=self.tempfile_storage,
    #         tools=set(),
    #     )

    def get_user_functions(
        self, task: str, model: str, file_prefix: Optional[str] = None
    ) -> Set[Callable]:
        # if task == "rag":
        #     return {
        #         self.get_keyword_search_tool(file_prefix).keyword_search,
        #         self.get_semantic_search_tool(file_prefix).semantic_search,
        #     }
        # if task == "specification":
        #     return {
        #         self.get_keyword_search_tool(file_prefix).keyword_search,
        #         self.get_semantic_search_tool(file_prefix).semantic_search,
        #     }
        if task == "multi-agent":
            return {
                self.get_keyword_search_tool(file_prefix).keyword_search,
                self.get_semantic_search_tool(file_prefix).semantic_search,
                self.get_research_agent_tool(
                    model, self.get_user_functions("rag", model, file_prefix)
                ).research_chat,
                # self.get_review_agent_tool(model).review_chat,
            }
        return {
            self.get_keyword_search_tool(file_prefix).keyword_search,
            self.get_semantic_search_tool(file_prefix).semantic_search,
        }


di_container = DIContainer()

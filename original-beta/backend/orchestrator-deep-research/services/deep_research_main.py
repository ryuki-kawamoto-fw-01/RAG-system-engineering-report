"""
クエリ処理のビジネスロジックを実装するモジュール
"""

import logging
import os

from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI

from models.deep_research import Source
from services.deep_research_agent import (
    DeepResearchAgent,
    ReflectionManager,
    ResearchReflector,
)

load_dotenv()


# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
#     handlers=[
#         logging.FileHandler(f"deep_research.log", encoding="utf-8"),
#         logging.StreamHandler(),
#     ],
# )

logger = logging.getLogger(__name__)


def deep_research(query_text: str) -> tuple[str, list[Source]]:
    """
    クエリテキストを処理して結果を返す

    Args:
        query_text (str): 処理する入力クエリ文字列

    Returns:
        str: 処理された結果
    """
    logger.info("Deep research start.")
    logger.info(f"Input query: {query_text}")

    credential = DefaultAzureCredential()
    token_provider = get_bearer_token_provider(
        credential, "https://cognitiveservices.azure.com/.default"
    )

    # クライアントの設定
    llm = AzureChatOpenAI(
        deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME_41"),
        azure_ad_token_provider=token_provider,
    )
    llm_reasoning = AzureChatOpenAI(
        deployment_name=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME_O4_MINI"),
        azure_ad_token_provider=token_provider,
    )

    # ReflectionManagerを初期化
    reflection_manager = ReflectionManager()

    # ResearchReflectorを初期化
    research_reflector = ResearchReflector(
        llm=llm_reasoning,
        reflection_manager=reflection_manager,
        logger=logger,
    )

    agent = DeepResearchAgent(
        llm=llm,
        llm_reasoning=llm_reasoning,
        reflection_manager=reflection_manager,
        research_reflector=research_reflector,
        logger=logger,
    )

    # 結果の生成
    final_result, sources = agent.run(query_text)
    logger.info(f"Final result:\n{final_result}")
    logger.info(f"Sources:\n{sources}")
    logger.info("Deep research completed.")

    return final_result, sources

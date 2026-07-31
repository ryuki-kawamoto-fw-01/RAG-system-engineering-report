import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from logging import Logger

from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import BingGroundingTool, MessageRole
from azure.identity import DefaultAzureCredential
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

from models.deep_research import (
    BingGroundingResult,
    DecomposedSection,
    SearchQueries,
    SearchResult,
    Source,
)
from services.reflect_on_research import (
    ReflectionManager,
    format_reflections,
    format_search_results,
)

from .prompts import query_writer_instructions


def bing_grounding(query: str, logger: Logger) -> BingGroundingResult | None:

    project_client = AIProjectClient.from_connection_string(
        credential=DefaultAzureCredential(),
        conn_str=os.environ["PROJECT_CONNECTION_STRING"],
    )

    bing_connection = project_client.connections.get(connection_name=os.environ["BING_CONNECTION_NAME"])
    conn_id = bing_connection.id

    bing = BingGroundingTool(connection_id=conn_id)

    with project_client:
        agent = project_client.agents.create_agent(
            model=os.environ["BING_GROUNDING_MODEL_DEPLOYMENT_NAME"],
            name="my-assistant",
            instructions="You are a helpful assistant",
            tools=bing.definitions,
            headers={"x-ms-enable-preview": "true"},
        )

        thread = project_client.agents.create_thread()

        message = project_client.agents.create_message(
            thread_id=thread.id,
            role=MessageRole.USER,
            content=query,
        )

        run = project_client.agents.create_and_process_run(thread_id=thread.id, agent_id=agent.id)

        project_client.agents.delete_agent(agent.id)

        if run.status == "failed":
            logger.error(f"Run failed: {run.last_error}")
            return None

        response_message = project_client.agents.list_messages(thread_id=thread.id).get_last_message_by_role(
            MessageRole.AGENT
        )
        if not response_message:
            return None

        response_messages = []
        citations = []
        for text_message in response_message.text_messages:
            logger.debug(f"Agent response: {text_message.text.value}")
            response_messages.append(text_message.text.value)

        # fix:url_citation_annotationsが存在せずにエラーになる。一旦if文で回避しているが引用元が表示されなくなってしまっている。
        if hasattr(response_message, "url_citation_annotations") and response_message.url_citation_annotations:
            for annotation in response_message.url_citation_annotations:
                logger.debug(f"URL Citation: [{annotation.url_citation.title}]({annotation.url_citation.url})")
                citations.append(
                    Source(
                        title=annotation.url_citation.title,
                        url=annotation.url_citation.url,
                    )
                )

        return BingGroundingResult(
            query=query,
            response_messages=response_messages,
            sources=citations,
        )


class BingResearcher:
    def __init__(self, logger: Logger):
        self.logger = logger

    def process_query(self, query: str) -> tuple[str, str, list[Source]]:
        result = bing_grounding(query, self.logger)
        if result:
            result_str = "\n".join(result.response_messages)
            sources = result.sources
        else:
            result_str = f"「{query}」の検索に失敗しました。"
            sources = []
        return query, result_str, sources

    def run(self, section_index: int, queries: SearchQueries) -> list[SearchResult]:
        search_results = []

        with ThreadPoolExecutor(max_workers=None) as executor:
            results = executor.map(self.process_query, [query.text for query in queries])
            for query_text, result_str, sources in results:
                search_results.append(
                    SearchResult(
                        section_index=section_index,
                        query=query_text,
                        result=result_str,
                        sources=sources,
                    )
                )
        return search_results


class SectionResearcher:
    def __init__(
        self,
        llm: AzureChatOpenAI,
        reflection_manager: ReflectionManager,
        logger: Logger,
    ):
        self.llm = llm
        self.bing_researcher = BingResearcher(logger)
        self.reflection_manager = reflection_manager
        self.logger = logger
        self.tools = []

    def run(
        self,
        section: DecomposedSection,
        past_search_results: list[SearchResult],
    ) -> list[SearchResult]:
        self.logger.info(f"Running research for section {section.section_name}")
        research_plan = section.section_research_plan
        self.logger.info(f"Research plan: {research_plan}")
        relevant_reflections = self.reflection_manager.get_relevant_reflections(section.section_index)
        reflection_text = format_reflections(relevant_reflections)
        self.logger.info(f"Reflection text: {reflection_text}")

        past_search_results = format_search_results(past_search_results)

        human_message = "Generate search queries on the provided topic."
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", query_writer_instructions),
                ("human", human_message),
            ]
        )
        chain = prompt | self.llm.with_structured_output(SearchQueries)
        search_queries = chain.invoke(
            {
                "section_name": section.section_name,
                "research_plan": research_plan,
                "past_search_results": past_search_results,
                "reflection_text": reflection_text,
            }
        )
        self.logger.info(f"Search queries: {search_queries.queries}")

        logging.disable(logging.INFO)
        search_results = self.bing_researcher.run(section.section_index, search_queries.queries)
        logging.disable(logging.NOTSET)
        self.logger.info("Search results:")
        for search_result in search_results:
            self.logger.info(search_result)

        return search_results

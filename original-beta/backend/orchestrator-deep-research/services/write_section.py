from datetime import datetime
from logging import Logger

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI
from retry import retry

from models.deep_research import DecomposedSection, SearchResult, SectionContent

from .prompts import (
    final_section_writer_instructions,
    section_writer_inputs,
    section_writer_instructions,
)
from .reflect_on_research import format_search_results


def get_search_results_for_each_section(
    sections: list[DecomposedSection],
    research_results: list[list[SearchResult]],
) -> dict[int, list[SearchResult]]:
    """
    各セクションのインデックスに対応する検索結果をマッピングします。

    Args:
        sections: 分解されたセクションのリスト
        research_results: 検索結果のネストされたリスト

    Returns:
        セクションインデックスをキー、対応する検索結果のリストを値とする辞書
    """
    # セクションごとに空のリストで初期化
    search_results_for_each_section = {i: [] for i in range(len(sections))}

    # すべての検索結果を適切なセクションに割り当て
    for result_group in research_results:
        for result in result_group:
            search_results_for_each_section[result.section_index].append(result)

    return search_results_for_each_section


class InvalidSourceError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.message = message


class SectionsWriter:
    def __init__(self, llm: AzureChatOpenAI, logger: Logger):
        self.llm = llm
        self.logger = logger
        self.current_date = datetime.now().strftime("%Y-%m-%d")

    def run(
        self,
        goal: str,
        sections: list[DecomposedSection],
        research_results: list[list[SearchResult]],
    ) -> list[SectionContent]:

        search_results_for_each_section = get_search_results_for_each_section(
            sections, research_results
        )

        prompt_pre = ChatPromptTemplate.from_messages(
            [
                ("system", section_writer_instructions),
                ("human", section_writer_inputs),
            ]
        )
        chain_pre = prompt_pre | self.llm.with_structured_output(SectionContent)

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", final_section_writer_instructions),
                (
                    "human",
                    "Generate a report section in Japanese based on the provided sources.",
                ),
            ]
        )
        chain = prompt | self.llm | StrOutputParser()

        section_contents: list[SectionContent] = []

        for section in sections:
            self.logger.info(f"Writing section: {section.section_name}")
            search_results = search_results_for_each_section[section.section_index]
            context = format_search_results(search_results)
            # self.logger.info(f"context:\n{context}")

            original_sources = [
                source
                for search_result in search_results
                for source in search_result.sources
            ]
            self.logger.info(f"Original sources:\n{original_sources}")

            chain_pre_input = {
                "goal": goal,
                "section_name": section.section_name,
                "section_topic": section.description,
                "context": context,
            }

            @retry(tries=10)
            def invoke_chain() -> SectionContent:
                # 引用が間違っていないことを確かめる
                section_content_pre: SectionContent = chain_pre.invoke(chain_pre_input)
                sources = section_content_pre.sources

                for source in sources:
                    if source not in original_sources:
                        title = source.title
                        url = source.url
                        if title in context and url in context:
                            # text_messages に直接入っている場合
                            self.logger.info(
                                f"The following source is not in bing citations but is in content."
                            )
                            self.logger.info(source)
                        else:
                            # ハルシネーション
                            self.logger.error(f"Unknown source: {source}")
                            self.logger.info(f"goal: {goal}")
                            self.logger.info(f"section_name: {section.section_name}")
                            self.logger.info(f"section_topic: {section.description}")
                            self.logger.info(f"context: {context}")
                            raise InvalidSourceError(f"Unknown source: {source}")

                return section_content_pre

            self.logger.info("Writing section content pre...")
            try:
                section_content_pre = invoke_chain()
                sources = section_content_pre.sources
                self.logger.info(f"sources:\n{sources}")
            except InvalidSourceError as e:
                self.logger.warning(
                    f"source validation failed for {section.section_name}. Remove invalid sources."
                )
                section_content_pre: SectionContent = chain_pre.invoke(chain_pre_input)
                sources = [
                    source
                    for source in section_content_pre.sources
                    if source in original_sources
                ]
                self.logger.info(f"pre sources:\n{section_content_pre.sources}")
                self.logger.info(f"sources:\n{sources}")
            self.logger.info(
                f"Section content pre:\n{section_content_pre.section_content}"
            )

            self.logger.info("Writing section content...")
            section_content = chain.invoke(
                {
                    "topic": section.description,
                    "section_name": section.section_name,
                    "section_topic": section.description,
                    "context": section_content_pre.section_content,
                }
            )
            self.logger.info(f"Section content:\n{section_content}")

            section_contents.append(
                SectionContent(
                    section_content=section_content,
                    sources=sources,
                )
            )

        return section_contents

from logging import Logger

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

from models.deep_research import Source, SectionContent

from .prompts import final_report_writer_instructions


class ResultAggregator:
    def __init__(self, llm: AzureChatOpenAI, logger: Logger):
        self.llm = llm
        self.logger = logger

    def run(
        self,
        goal: str,
        section_contents: list[SectionContent],
    ) -> tuple[str, list[Source]]:
        self.logger.info(f"Writing the final report.")

        report_draft = "\n\n".join(
            [section_content.section_content for section_content in section_contents]
        )
        self.logger.info(f"Report draft:\n{report_draft}")
        sources = [
            source
            for section_content in section_contents
            for source in section_content.sources
        ]

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", final_report_writer_instructions),
                ("human", report_draft),
            ]
        )
        chain = prompt | self.llm | StrOutputParser()
        final_report = chain.invoke({"goal": goal})
        return final_report, sources

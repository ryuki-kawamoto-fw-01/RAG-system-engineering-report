from logging import Logger

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

from models.deep_research import DecomposedSections

from .prompts import (
    report_planner_instructions,
    report_structure,
)


class SectionDecomposer:
    def __init__(self, llm: AzureChatOpenAI, logger: Logger):
        self.llm = llm
        self.logger = logger

    def run(self, goal: str, whole_research_plan: str) -> DecomposedSections:
        system_instructions_sections = report_planner_instructions.format(
            goal=goal,
            whole_research_plan=whole_research_plan,
            report_organization=report_structure,
        )
        planner_message = (
            "Generate the sections of the report. "
            + "Your response must include a 'sections' field containing a list of sections.\n"
            + "Each section must have: index, name, description, plan."
        )
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_instructions_sections),
                ("human", planner_message),
            ]
        )
        chain = prompt | self.llm.with_structured_output(DecomposedSections)
        result = chain.invoke(
            {"goal": goal, "whole_research_plan": whole_research_plan}
        )
        for section in result.sections:
            self.logger.info(f"Section index: {section.section_index}")
            self.logger.info(f"Section name: {section.section_name}")
            self.logger.info(f"Section research plan: {section.section_research_plan}")
        return result

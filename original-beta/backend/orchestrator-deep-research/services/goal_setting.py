from logging import Logger

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureChatOpenAI

from models.deep_research import OptimizedGoal, WholeResearchPlan

from .prompts import (
    query_analysis_instructions,
    research_planner_instruction,
)


class PromptOptimizer:
    def __init__(self, llm: AzureChatOpenAI):
        self.llm = llm

    def run(self, query: str) -> OptimizedGoal:
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", query_analysis_instructions),
                ("human", "{input}"),
            ]
        )
        chain = prompt | self.llm.with_structured_output(OptimizedGoal)
        return chain.invoke({"input": query})


class ReasoningGoalCreator:
    def __init__(self, llm: AzureChatOpenAI, logger: Logger):
        self.llm = llm
        self.logger = logger
        self.prompt_optimizer = PromptOptimizer(llm=self.llm)

    def run(self, query: str) -> str:
        goal = self.prompt_optimizer.run(query=query)
        self.logger.info(f"Created optimized goal: {goal.text}")
        return goal.text


class WholeResearchPlanner:
    def __init__(self, llm: AzureChatOpenAI, logger: Logger):
        self.llm = llm
        self.logger = logger

    def run(self, query: str) -> str:
        human_message = "Generate a research plan for the topic:\n{query}"
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", research_planner_instruction),
                ("human", human_message),
            ]
        )
        chain = prompt | self.llm.with_structured_output(WholeResearchPlan)
        result = chain.invoke({"query": query})
        self.logger.info(f"Created whole research plan: {result.text}")
        return result.text

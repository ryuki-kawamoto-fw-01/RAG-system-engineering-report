import os
from logging import Logger
from typing import Any

from langchain_openai import AzureChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

from models.deep_research import (
    DecomposedSections,
    DeepResearchAgentState,
    Source,
)

from .aggregate_results import ResultAggregator
from .decompose_section import SectionDecomposer
from .execute_research import SectionResearcher
from .goal_setting import ReasoningGoalCreator, WholeResearchPlanner
from .reflect_on_research import (
    ReflectionManager,
    ResearchReflector,
)
from .write_section import SectionsWriter

MAX_RETRIES = int(os.getenv("SEARCH_MAX_RETRIES", 3))


class DeepResearchAgent:
    def __init__(
        self,
        llm: AzureChatOpenAI,
        llm_reasoning: AzureChatOpenAI,
        reflection_manager: ReflectionManager,
        research_reflector: ResearchReflector,
        logger: Logger,
        max_retries: int = MAX_RETRIES,
    ):
        self.llm = llm
        self.llm_reasoning = llm_reasoning
        self.reflection_manager = reflection_manager
        self.research_reflector = research_reflector
        self.logger = logger
        self.reasoning_goal_creator = ReasoningGoalCreator(
            llm=llm_reasoning, logger=self.logger
        )
        self.whole_research_planner = WholeResearchPlanner(
            llm=llm_reasoning, logger=self.logger
        )
        self.section_decomposer = SectionDecomposer(
            llm=llm_reasoning, logger=self.logger
        )
        self.research_executor = SectionResearcher(
            llm=llm_reasoning,
            reflection_manager=self.reflection_manager,
            logger=self.logger,
        )
        self.sections_writer = SectionsWriter(llm=llm_reasoning, logger=self.logger)
        self.result_aggregator = ResultAggregator(llm=llm_reasoning, logger=self.logger)
        self.max_retries = max_retries
        self.graph = self._create_graph()

    def _create_graph(self) -> CompiledStateGraph:
        graph = StateGraph(DeepResearchAgentState)
        graph.add_node("goal_setting", self._goal_setting)
        graph.add_node("decompose_section", self._decompose_section)
        graph.add_node("execute_research", self._execute_research)
        graph.add_node("reflect_on_research", self._reflect_on_research)
        graph.add_node("update_section_index", self._update_section_index)
        graph.add_node("write_sections", self._write_sections)
        graph.add_node("aggregate_results", self._aggregate_results)
        graph.set_entry_point("goal_setting")
        graph.add_edge("goal_setting", "decompose_section")
        graph.add_edge("decompose_section", "execute_research")
        graph.add_edge("execute_research", "reflect_on_research")
        graph.add_conditional_edges(
            "reflect_on_research",
            self._should_retry_or_continue,
            {
                "retry": "execute_research",
                "continue": "update_section_index",
                "finish": "write_sections",
            },
        )
        graph.add_edge("update_section_index", "execute_research")
        graph.add_edge("write_sections", "aggregate_results")
        graph.add_edge("aggregate_results", END)
        return graph.compile()

    def _goal_setting(self, state: DeepResearchAgentState) -> dict[str, Any]:
        goal: str = self.reasoning_goal_creator.run(query=state.query)
        whole_research_plan: str = self.whole_research_planner.run(query=goal)
        return {
            "goal": goal,
            "whole_research_plan": whole_research_plan,
        }

    def _decompose_section(self, state: DeepResearchAgentState) -> dict[str, Any]:
        sections: DecomposedSections = self.section_decomposer.run(
            goal=state.goal,
            whole_research_plan=state.whole_research_plan,
        )
        return {"sections": sections.sections}

    def _execute_research(self, state: DeepResearchAgentState) -> dict[str, Any]:
        current_section = state.sections[state.current_section_index]
        past_search_results = []
        for results in state.research_results:
            for result in results:
                if result.section_index == state.current_section_index:
                    past_search_results.append(result)
        search_results = self.research_executor.run(
            section=current_section, past_search_results=past_search_results
        )
        return {
            "research_results": [search_results],
            "current_section_index": state.current_section_index,
        }

    def _reflect_on_research(self, state: DeepResearchAgentState) -> dict[str, Any]:
        current_section = state.sections[state.current_section_index]
        current_section_search_results = []
        for results in state.research_results:
            for result in results:
                if result.section_index == state.current_section_index:
                    current_section_search_results.append(result)

        reflection = self.research_reflector.run(
            section=current_section, results=current_section_search_results
        )
        return {
            "reflection_ids": [reflection.id],
            "retry_count": (
                state.retry_count + 1 if reflection.reflection.needs_retry else 0
            ),
        }

    def _should_retry_or_continue(self, state: DeepResearchAgentState) -> str:
        latest_reflection_id = state.reflection_ids[-1]
        latest_reflection = self.reflection_manager.get_reflection(latest_reflection_id)
        if (
            latest_reflection
            and latest_reflection.reflection.needs_retry
            and state.retry_count < self.max_retries
        ):
            return "retry"
        elif state.current_section_index < len(state.sections) - 1:
            return "continue"
        else:
            return "finish"

    def _update_section_index(self, state: DeepResearchAgentState) -> dict[str, Any]:
        return {"current_section_index": state.current_section_index + 1}

    def _write_sections(self, state: DeepResearchAgentState) -> dict[str, Any]:
        section_contents = self.sections_writer.run(
            goal=state.goal,
            sections=state.sections,
            research_results=state.research_results,
        )
        return {"section_contents": section_contents}

    def _aggregate_results(self, state: DeepResearchAgentState) -> dict[str, Any]:
        final_output, sources = self.result_aggregator.run(
            goal=state.goal,
            section_contents=state.section_contents,
        )
        return {"final_output": final_output, "sources": sources}

    def run(self, query: str) -> tuple[str, list[Source]]:
        initial_state = DeepResearchAgentState(query=query)
        final_state = self.graph.invoke(initial_state, {"recursion_limit": 1000})
        final_output = final_state.get("final_output", "エラー: 出力に失敗しました。")
        sources = final_state.get("sources", [])
        return final_output, sources

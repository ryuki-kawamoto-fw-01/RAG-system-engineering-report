import uuid
from logging import Logger

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate
from retry import retry

from models.deep_research import (
    DecomposedSection,
    Reflection,
    ReflectionJudgment,
    SearchResult,
)

from .prompts import research_grader_instructions


class ReflectionManager:
    def __init__(self):
        self.reflections: dict[str, Reflection] = {}

    def save_reflection(
        self, section: DecomposedSection, reflection_judgement: ReflectionJudgment
    ) -> tuple[str, Reflection]:
        reflection_id = str(uuid.uuid4())
        reflection = Reflection(
            id=reflection_id, section=section, reflection=reflection_judgement
        )
        self.reflections[reflection_id] = reflection
        return reflection_id, reflection

    def get_reflection(self, reflection_id: str) -> Reflection | None:
        return self.reflections.get(reflection_id)

    def get_relevant_reflections(self, section_index: int) -> list[Reflection]:
        return [
            reflection
            for reflection in self.reflections.values()
            if reflection.section.section_index == section_index
        ]


def format_search_results(search_results: list[SearchResult]) -> str:
    """Convert search results to XML format string."""
    xml_output = "<search_results>\n"
    for result in search_results:
        xml_output += f"  <search_result>\n"
        xml_output += f"    <query>{result.query}</query>\n"
        xml_output += f"    <result>{result.result}</result>\n"
        sources = result.sources
        xml_output += "    <sources>\n"
        for source in sources:
            xml_output += f"      <source><title>{source.title}</title><url>{source.url}</url></source>\n"
        xml_output += "    </sources>\n"
        xml_output += f"  </search_result>\n"
    xml_output += "</search_results>"
    return xml_output


def format_reflections(reflections: list[Reflection]) -> str:
    return (
        "\n\n".join(
            f"<ref_{i}><task>{r.section.section_research_plan}</task><reflection>{r.reflection}</reflection></ref_{i}>"
            for i, r in enumerate(reflections)
        )
        if reflections
        else "No relevant past reflections."
    )


class ResearchReflector:
    def __init__(
        self, llm: BaseChatModel, reflection_manager: ReflectionManager, logger: Logger
    ):
        self.llm = llm.with_structured_output(ReflectionJudgment)
        self.reflection_manager = reflection_manager
        self.logger = logger

    def run(
        self, section: DecomposedSection, results: list[SearchResult]
    ) -> Reflection:
        # 与えられた section と、そのリサーチ結果 results に対して、リフレクションを行う
        self.logger.info("Running research reflector...")
        section_name = section.section_name
        description = section.description
        section_research_plan = section.section_research_plan
        search_results = format_search_results(results)
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", research_grader_instructions),
                ("human", "Give me your reflection on this task."),
            ]
        )
        chain = prompt | self.llm

        @retry(tries=5)
        def invoke_chain() -> ReflectionJudgment:
            return chain.invoke(
                {
                    "section_name": section_name,
                    "description": description,
                    "section_research_plan": section_research_plan,
                    "search_results": search_results,
                }
            )

        reflection_judgement = invoke_chain()
        self.logger.info(f"Reflection judgement: {reflection_judgement}")
        _, reflection = self.reflection_manager.save_reflection(
            section, reflection_judgement
        )
        return reflection

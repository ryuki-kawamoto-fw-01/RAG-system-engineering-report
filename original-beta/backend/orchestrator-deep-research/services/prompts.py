# https://github.com/langchain-ai/open_deep_research/blob/main/src/open_deep_research/prompts.py


# レポート構造
report_structure = """Use this structure to create a report on the user-provided topic:

1. Introduction (no research needed)
   - Brief overview of the topic area

2. Main Body Sections:
   - Each section should focus on a sub-topic of the user-provided topic
   
3. Conclusion
   - Aim for 1 structural element (either a list of table) that distills the main body sections 
   - Provide a concise summary of the report"""


# ユーザーのクエリ分析用プロンプト
query_analysis_instructions = """Role:
You are an expert in goal setting and web research structuring. Your task is to analyze user queries and formulate clear, actionable research objectives. Your objectives should align with the user's intent, ensuring a structured approach to obtaining valuable insights.

Instructions:
1. Understand the User's Query:
  - Analyze the user's input to extract key intent, underlying needs, and context.
  - Identify any missing or ambiguous elements in their request.
2. Define a Web Research Goal:
  - Convert the user's input into a precise research goal.
  - Ensure the goal is clear, specific, and measurable.
  - If necessary, break the goal into sub-goals for better clarity.
3. Establish Success Criteria:
  - Specify detailed and concrete metrics to evaluate the achievement of the research goal.
  - Provide a clear methodology for how the research should be validated or tested.
  - Suggest methods such as comparative analysis, case studies, numerical benchmarks, or qualitative assessments to measure progress.
4. Enhance the Goal's Quality:
  - Identify potential gaps in the original goal and improve its clarity.
  - Ensure the goal is realistic and achievable within the given constraints.

Example Output Format:
- User Query: "How can I improve the efficiency of LLM inference?"
- Research Goal: "Investigate optimization techniques to reduce latency and computational costs of LLM inference while maintaining output quality."
- Success Criteria:
  - Conduct benchmark testing before and after optimization.
  - Compare inference time reductions (e.g., 20% improvement target).
  - Evaluate model output fidelity using perplexity or human evaluation.
  - Identify trade-offs in speed vs. accuracy based on real-world deployment scenarios.
"""


research_planner_instruction = """
Role:
You are an expert in structuring web research plans. Your task is to generate a high-level web research plan based on a given research goal. The plan should outline key topics to investigate and suggest general approaches for gathering relevant information online.

Instructions:
1. Analyze the Research Goal:
  - Identify the main themes and subtopics that need to be explored.
2. Outline Key Research Areas:
  - List major topics or questions that must be addressed to achieve the goal.
3. Suggest Search Strategies:
  - Provide general guidance on how to find relevant information, such as academic sources, industry reports, technical blogs, and forums.
4. Provide a Logical Research Flow:
  - Organize the research into broad phases or steps to ensure a structured approach.

Example Output Format:
User's Research Goal:
"Investigate optimization techniques to reduce latency and computational costs of LLM inference while maintaining output quality."
Research Plan:
1. Core Topics to Investigate:
  - Common bottlenecks in LLM inference.
  - Optimization techniques (quantization, pruning, distillation, caching, hardware acceleration).
  - Trade-offs between performance improvements and accuracy loss.
  - Real-world case studies and industry best practices.
2. Suggested Search Approach:
  - Find recent academic papers (e.g., Google Scholar, arXiv).
  - Look for industry insights in technical blogs (e.g., Hugging Face, NVIDIA, OpenAI).
  - Explore forum discussions and GitHub issues for practical implementation details.
  - Check official documentation for optimization tools (e.g., TensorRT, ONNX Runtime).
3. Research Flow:
  - Step 1: Identify current challenges in LLM inference performance.
  - Step 2: Gather information on various optimization techniques.
  - Step 3: Compare techniques and analyze trade-offs.
  - Step 4: Find real-world applications and benchmarks.
"""


# レポート構造作成・各セクションのリサーチプラン作成用プロンプト
report_planner_instructions = """I want a plan for a report that is concise and focused, and I also want a web research plan for each section.

<Report topic>
The topic of the report is:
{goal}
</Report topic>

<Whole research plan>
The whole research plan is:
{whole_research_plan}
</Whole research plan>

<Report organization>
The report should follow this organization: 
{report_organization}
</Report organization>

<Task>
Generate a list of sections for the report, and for each section, provide a research plan.
Your plan should be tight and focused with NO overlapping sections or unnecessary filler. 

For example, a good report structure might look like:
1/ intro
2/ overview of topic A
3/ overview of topic B
4/ comparison between A and B
5/ conclusion

Each section should have the fields:

- Index - The order of the section in the report, starting from 0.
- Name - Name for this section of the report.
- Description - Brief overview of the main topics covered in this section.
- Research Plan - A concise plan for researching this section.

Integration guidelines:
- Include examples and implementation details within main topic sections, not as separate sections
- Ensure each section has a distinct purpose with no content overlap
- Combine related concepts rather than separating them

Before submitting, review your structure to ensure it has no redundant sections and follows a logical flow.
</Task>
"""


# クエリ作成用プロンプト
query_writer_instructions = """You are an expert technical writer crafting targeted web search queries that will gather comprehensive information for writing a technical report section.

<Section name>
{section_name}
</Section name>

<Research plan>
{research_plan}
</Research plan>

<Task>
Your goal is to generate 0 to 4 search queries that will help gather comprehensive information above the section topic. 

The queries should:

1. Be related to the topic 
2. Examine different aspects of the topic
3. Avoid redundancy by considering past searches and focusing on unexplored angles.
4. Provide alternative perspectives, such as different methodologies, recent developments, or industry-specific applications.

Before generating queries, analyze the past search results and feedback to identify gaps in information coverage.
Make the queries specific enough to find high-quality, relevant sources.
</Task>

{past_search_results}

<Feedback>
Here is feedback on the report structure from review (if any):
{reflection_text}
</Feedback>
"""


# リサーチ結果の評価用のプロンプト
research_grader_instructions = """Evaluate the relevance and completeness of the gathered research results based on the research plan.

<Section Name>
{section_name}
</Section Name>

<Section Description>
{description}
</Section Description>

<Research Plan>
{section_research_plan}
</Research Plan>

<Search Results>
{search_results}
</Search Results>

<Task>
Assess whether the gathered search results sufficiently cover the key aspects outlined in the research plan.

1. If the search results adequately address the research plan, provide a "pass" grade (i.e. needs_retry is False).
2. If there are significant gaps or missing key information, provide a "fail" grade (i.e. needs_retry is True).
3. If the grade is "fail," generate 2 to 4 follow-up search queries to gather missing information. Additionally, reflect on the effectiveness of the research process and suggest improvements for future searches.
</Task>

<Format>
Output with the following schema:

reflection: A brief review of the research process, identifying any improvements or key takeaways for future iterations (2-3 sentences).
needs_retry: Boolean value indicating whether a retry is necessary based on the adequacy of the research results.
confidence: A confidence score (0-1) reflecting the evaluator's certainty in their assessment.
reasons: List of concise reasons explaining why the evaluation was made and why a retry is or isn't needed.
</Format>
"""


# セクション作成用指示プロンプト
section_writer_instructions = """Write one section of a research report in Japanese.

<Task>
1. Review the report topic, section name, and section topic carefully.
2. Look at the provided Source material.
3. Decide the sources that you will use to write a report section.
4. Write the report section in Japanese and list your sources. 
</Task>

<Writing_Guidelines>
- Strict 300-500 character limit
- Use simple, clear language
- Use short paragraphs (2-3 sentences max)
- Use ## for section title (Markdown format)
</Writing_Guidelines>

<Citation_Rules>
- Assign each unique URL a single citation number in your text
- End with ### Sources that lists each source with corresponding numbers
- IMPORTANT: Number sources sequentially without gaps (1,2,3,4...) in the final list regardless of which sources you choose
- Example format:
  [1] Source Title: URL
  [2] Source Title: URL
</Citation_Rules>

<Output_Format>
Respond in the following JSON format:

{{
  "section_content": "string (the report section, including sources)",
  "sources": [
    {{
      "title": "string (title of the source)",
      "url": "string (url of the source)"
    }},
    ...
  ]
}}
</Output_Format>

<Final_Check>
1. Verify that EVERY claim is grounded in the provided Source material.
2. Confirm each URL appears ONLY ONCE in the Source list.
3. Verify that sources are numbered sequentially (1,2,3...) without any gaps.
4. For the sources field in the output, include only the sources listed in the <Source_Material> element. If <Source_Material> does not contain any sources, return an empty list for sources.
</Final_Check>
"""


# セクション作成のインプット
section_writer_inputs = """ 
<Report_Topic>
{goal}
</Report_Topic>

<Section_Name>
{section_name}
</Section_Name>

<Section_Topic>
{section_topic}
</Section_Topic>

<Source_Material>
{context}
</Source_Material>
"""


# レポートのセクション推敲用のプロンプト
final_section_writer_instructions = """You are an expert technical writer crafting a section that synthesizes information from the rest of the report.

<Report_Topic>
{topic}
</Report_Topic>

<Section_Name>
{section_name}
</Section_Name>

<Section_Topic> 
{section_topic}
</Section_Topic>

<Available_Report_Content>
{context}
</Available_Report_Content>

<Task>
1. Section-Specific Approach:

For Introduction:
- Use # for report title (Markdown format)
- 100-250 character limit
- Write in simple and clear language
- Focus on the core motivation for the report in 1-2 paragraphs
- Use a clear narrative arc to introduce the report
- Include NO structural elements (no lists or tables)
- No sources section needed

For Conclusion/Summary:
- Use ## for section title (Markdown format)
- 200-400 character limit
- For comparative reports:
    * Must include a focused comparison table using Markdown table syntax
    * Table should distill insights from the report
    * Keep table entries clear and concise
- For non-comparative reports: 
    * Only use ONE structural element IF it helps distill the points made in the report:
    * Either a focused table comparing items present in the report (using Markdown table syntax)
    * Or a short list using proper Markdown list syntax:
      - Use `*` or `-` for unordered lists
      - Use `1.` for ordered lists
      - Ensure proper indentation and spacing
- End with specific next steps or implications
- No sources section needed

2. Writing Approach:
- Use concrete details over general statements
- Make every character count
- Focus on your single most important point
</Task>

<Quality_Checks>
- For introduction: 100-250 character limit, # for report title, no structural elements, no sources section
- For conclusion: 200-400 character limit, ## for section title, only ONE structural element at most, no sources section
- Markdown format
- Do not include character count or any preamble in your response
- Make sure the report is written in Japanese
</Quality_Checks>"""


final_report_writer_instructions = """You are an editorial reviewer who refines the technical report.

<Report_Topic>
{goal}
</Report_Topic>

<Task>
Your task is to review and improve the report while preserving its original content and intent.
- Make only minor refinements to improve clarity, coherence, and readability.
- Do not introduce major structural changes or alter the meaning of the content.
- If there are no issues, output the report exactly as it is.
- Do not include anything unrelated to the report.
</Task>"""

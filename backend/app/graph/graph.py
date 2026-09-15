import datetime as dt
from typing import Annotated

from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import BaseModel

from app.db.safe_layer import SafeDBLayer
from app.graph.schemas import StructuredAnalysis
from app.llm import get_llm
from app.tools import make_sql_tool, make_schema_tool


class GraphState(BaseModel):
    messages: Annotated[list[BaseMessage], add_messages]
    analysis: StructuredAnalysis | None = None


SYSTEM_PROMPT = """You are a business data analyst. You answer questions about
sales and inventory by writing SQL for the query_sales_data tool.

Today is {today}. Interpret relative dates using this date. For example, "this
month" means from the first day of the current calendar month through today.

You do not know the exact schema in advance. If you're not certain of a table
name, column name, or how tables join together, call describe_schema first —
it returns the real, current schema. Do not guess column names; look them up.

You MUST call query_sales_data before answering any question about sales,
products, branches, or inventory. Never answer a data question from general
knowledge.

SQL rules the tool will enforce:
- Exactly one SELECT (UNION is allowed).
- Only the tables/views returned by describe_schema, in the public schema.
- Name every selected column. No SELECT *, comments, or CTEs.
- Include a numeric LIMIT of 200 or less.
- Prefer aggregations (SUM, COUNT, GROUP BY) over dumping raw rows.
- For any result you will later chart, alias the category or date as label
  and the metric as value, for example:
  SELECT p.name AS label, SUM(s.revenue) AS value
  FROM sales s JOIN products p ON p.sku = s.product_sku
  GROUP BY p.name ORDER BY value ASC LIMIT 10

Investigation style:
1. If unsure of the schema, call describe_schema first.
2. Start with the top-line numbers for the period in the question.
3. If something looks off, break it down — by product, branch, or inventory.
4. If the tool rejects a query, fix the SQL and try again. Do not invent numbers.
5. Stop once you can point to a concrete finding, or you have checked the
   obvious angles and found nothing — then say that plainly.

Final-answer style:
- Lead with a direct answer or the most important finding.
- Use short paragraphs and Markdown bullets only when they make findings easier
  to scan.
- State dates, comparison periods, and numbers clearly.
- Keep the answer concise and use plain business language.
- End with a practical next step only when the data supports one.
"""

STRUCTURED_OUTPUT_PROMPT = """The data investigation is complete. Do not call
tools. Synthesize an executive-ready JSON report from the query results in this
conversation.

Return ONLY valid JSON with this exact schema:
{
  "answer": {
    "summary": "Direct, executive-level answer in 1-2 concise sentences, citing the primary headline metric, delta, or volume, and the exact date range.",
    "findings": [
      "Precise finding with exact figures, product names, branch locations, and dates. 1 sentence each."
    ],
    "conclusion": "Commercial and operational context: what these figures signify for the business, risks, or performance trends, without repeating the summary verbatim."
  },
  "charts": [
    {
      "id": "revenue-by-product",
      "type": "bar",
      "title": "Revenue by product",
      "x_axis": "Product",
      "y_axis": "Revenue (MAD)",
      "data": [{"label": "Espresso Blend", "value": 12450.5}]
    }
  ],
  "suggested_actions": [
    "Specific operational recommendation with concrete action, affected product/branch, and clear target."
  ]
}

Analytical standards:
- summary: Lead with the bottom line. State the core figure or answer immediately.
- findings: Highlight the key drivers, top/bottom performers, notable shifts, or inventory alerts. Maximum 5 punchy bullet points.
- conclusion: Provide business perspective — highlight implications for revenue, stock health, or operational bottlenecks.
- suggested_actions: Provide 2-3 tangible next steps (e.g. replenishment quantities, pricing checks, branch reallocations, or follow-up audits). Avoid vague advice like "review data".
- Grounding: Never extrapolate unverified figures. Copy numbers, SKUs, and dates faithfully from the query tables.
- If the queries did not yield sufficient data, state the limitation clearly in the conclusion and keep suggested_actions empty.

Chart rules (the frontend plots charts[] directly):
- Return 1-3 charts whenever query data contains two or more comparable numeric points.
- type must be "bar" for categorical comparisons (products, branches, categories, SKUs).
- type must be "line" strictly for chronological time series (dates, weeks, months) in ascending order.
- data[].label must be concise and descriptive. data[].value must be a numeric value, never a formatted string or null.
- Include 2-16 data points per chart.
- y_axis label must include the unit (e.g., 'Revenue (MAD)', 'Units Sold', 'Quantity on Hand').
- If data is insufficient for a meaningful comparison, do not fabricate a chart.
"""


def build_graph(db: SafeDBLayer):
    tools = [make_sql_tool(db), make_schema_tool(db)]
    llm = get_llm()
    llm_with_tools = llm.bind_tools(tools)
    structured_llm = llm.with_structured_output(
        StructuredAnalysis,
        method="json_mode",
    )
    system_prompt = SYSTEM_PROMPT.format(today=dt.date.today().isoformat())

    async def call_model(state: GraphState):
        messages = [SystemMessage(content=system_prompt), *state.messages]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    async def format_response(state: GraphState):
        raw = await structured_llm.ainvoke(
            [
                SystemMessage(content=STRUCTURED_OUTPUT_PROMPT),
                *state.messages,
            ]
        )
        analysis = (
            raw
            if isinstance(raw, StructuredAnalysis)
            else StructuredAnalysis.model_validate(raw)
        )
        charts = [chart for chart in analysis.charts if len(chart.data) >= 2][:3]
        return {"analysis": analysis.model_copy(update={"charts": charts})}

    tool_node = ToolNode(tools)
    graph = StateGraph(GraphState)

    graph.add_node("llm", call_model)
    graph.add_node("tools", tool_node)
    graph.add_node("format_response", format_response)

    graph.add_edge(START, "llm")
    graph.add_conditional_edges(
        "llm",
        tools_condition,
        {"tools": "tools", END: "format_response"},
    )
    graph.add_edge("tools", "llm")
    graph.add_edge("format_response", END)
    return graph.compile()
import datetime as dt
from typing import Annotated

from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from pydantic import BaseModel

from app.db.safe_layer import SafeDBLayer
from app.graph.schemas import StructuredAnalysis
from app.llm import get_llm
from app.tools import make_sql_tool


class GraphState(BaseModel):
    messages: Annotated[list[BaseMessage], add_messages]
    analysis: StructuredAnalysis | None = None


SYSTEM_PROMPT = """You are a business data analyst. You answer questions about
sales and inventory by writing SQL for the query_sales_data tool.

Today is {today}. Interpret relative dates using this date. For example, "this
month" means from the first day of the current calendar month through today.

You MUST call query_sales_data before answering any question about sales,
products, branches, or inventory. Never answer a data question from general
knowledge.

Approved relations and columns:
- sales(sale_date, branch_id, product_sku, units_sold, revenue)
- products(sku, name)
- branches(branch_id, name)
- inventory_view(sku, product_name, category, quantity_on_hand, reorder_threshold)

SQL rules the tool will enforce:
- Exactly one SELECT (UNION is allowed).
- Only the relations above, in the public schema.
- Name every selected column. No SELECT *, comments, or CTEs.
- Include a numeric LIMIT of 200 or less.
- Prefer aggregations (SUM, COUNT, GROUP BY) over dumping raw rows.
- For any result you will later chart, alias the category or date as label
  and the metric as value, for example:
  SELECT p.name AS label, SUM(s.revenue) AS value
  FROM sales s JOIN products p ON p.sku = s.product_sku
  GROUP BY p.name ORDER BY value ASC LIMIT 10

Investigation style:
1. Start with the top-line numbers for the period in the question.
2. If something looks off, break it down — by product, branch, or inventory.
3. If the tool rejects a query, fix the SQL and try again. Do not invent numbers.
4. Stop once you can point to a concrete finding, or you have checked the
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
tools. Build a client-ready JSON report from the query tables already in this
conversation.

Return ONLY valid JSON with this exact shape:
{
  "answer": {
    "summary": "Direct answer in 1-2 sentences, including the key number and period.",
    "findings": [
      "One sentence with a concrete number, label, and date range."
    ],
    "conclusion": "What this means for the business, without repeating the summary."
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
  "suggested_actions": ["One practical next step supported by the data."]
}

Writing rules:
- summary, findings, and conclusion must be readable by a store manager.
- Each finding is one sentence. Max 6 findings.
- Do not invent numbers, labels, or dates. Copy them from the query tables.
- If the queries did not answer the question, say so in the conclusion and
  leave suggested_actions empty.

Chart rules (the frontend plots charts[] directly):
- Return 1-3 charts whenever a table has two or more comparable numeric rows.
- type must be "bar" for products, branches, SKUs, or categories.
- type must be "line" only for dates or time periods, in chronological order.
- data[].label is a short string. data[].value is a JSON number, never a string.
- Use 2-16 points. Prefer label/value columns when the table has them.
- y_axis must include the unit, usually MAD, units, or quantity on hand.
- Skip a chart rather than guessing missing values.
"""


def build_graph(db: SafeDBLayer):
    tools = [make_sql_tool(db)]
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

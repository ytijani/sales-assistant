


import datetime as dt
from typing import Annotated

from pydantic import BaseModel
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from app.db.safe_layer import SafeDBLayer
from app.tools import (
   make_inventory_tool,
   make_sales_by_branch_tool,
   make_sales_by_product_tool,
   make_sales_tool,
   make_sql_tool,
)
from app.llm import get_llm
from app.graph.schemas import StructuredAnalysis



class GraphState(BaseModel):
    messages: Annotated[list[BaseMessage], add_messages]
    analysis: StructuredAnalysis | None = None


SYSTEM_PROMPT = """You are a business data analyst investigating
questions about sales and inventory using the tools provided.

Today is {today}. Interpret relative dates using this date. For example, "this
month" means from the first day of the current calendar month through today.

You MUST call an appropriate tool before answering any question about sales,
products, branches, or inventory. Never answer a data question from general
knowledge. For questions about best-selling or worst-selling products, use
get_sales_by_product. For questions about branch performance, use
get_sales_by_branch.
 
For open-ended questions like "why did sales drop?", do NOT answer
after a single tool call. Investigate step by step:
 
1. Get the top-line numbers first.
2. If something looks off, break it down further — by product, by
   branch, by inventory — to find where the change is concentrated.
3. Only stop calling tools once you can point to a specific, concrete
   cause, or you've checked the obvious angles and found nothing —
   in which case say that plainly rather than guessing.
4. Briefly explain your reasoning in the final answer: what you
   checked, what you found, what you ruled out.
 
Rules:
- Only use the tools given to you. Never claim to run SQL or access
  the database directly — you don't have that ability. For custom analysis not
  covered by a dedicated tool, you may use query_sales_data; its safety policy
  validates generated SQL before execution.
- If a tool returns "No records found" or a validation error, relay
  that plainly instead of guessing at numbers.
- Do not speculate about data you haven't retrieved via a tool call.

Final-answer style:
- Lead with a direct answer or the most important finding.
- Use short paragraphs and Markdown bullets only when they make several
  findings easier to scan.
- Use clear labels such as **Summary**, **What changed**, and **Next step**
  when helpful; omit sections that have nothing useful to say.
- State dates, comparison periods, and numbers clearly. Round only when it
  improves readability, and keep enough precision to avoid changing meaning.
- Keep the answer concise and use plain business language. Explain technical
  terms briefly when they are necessary.
- End with a practical next step only when the data supports one.
"""

STRUCTURED_OUTPUT_PROMPT = """The data investigation is complete. Do not call
tools. Create the final response only from the tool results already in this
conversation.

Return ONLY valid JSON with this exact shape:
{
  "answer": {
    "summary": "string",
    "findings": ["string"],
    "conclusion": "string"
  },
  "charts": [
    {
      "id": "string",
      "type": "bar or line",
      "title": "string",
      "x_axis": "string",
      "y_axis": "string",
      "data": [{"label": "string", "value": 0}]
    }
  ],
  "suggested_actions": ["string"]
}

Only state facts supported by the tool messages. Do not invent evidence, numbers,
or tool calls. If the tools did not provide enough information, say so clearly in
the conclusion and leave suggested_actions empty unless an action is supported by
the retrieved data.

For charts, return at most three. When a tool result contains two or more
comparable numeric values, you MUST return at least one chart. A chart must
contain only numeric points that can be read or calculated directly from the
tool results. Use a bar chart for products, branches, or inventory categories,
and a line chart only when the tool results include time-series data. Return an
empty charts list only when the retrieved data has no chartable numeric series.
"""



def build_graph(db:SafeDBLayer):
   tools = [
      make_sales_tool(db),
      make_sales_by_product_tool(db),
      make_sales_by_branch_tool(db),
      make_inventory_tool(db),
      make_sql_tool(db),
   ]
   llm = get_llm()
   llm_with_tools = llm.bind_tools(tools)
   structured_llm = llm.with_structured_output(
      StructuredAnalysis,
      method="json_mode",
   )
   system_prompt = SYSTEM_PROMPT.format(today=dt.date.today().isoformat())
   
   async def call_model(state: GraphState):
      messages = [SystemMessage(content=system_prompt),*state.messages]
      response = await llm_with_tools.ainvoke(messages)
      return {"messages": [response]}

   async def format_response(state: GraphState):
      analysis = await structured_llm.ainvoke(
         [
            SystemMessage(content=STRUCTURED_OUTPUT_PROMPT),
            *state.messages,
         ]
      )
      return {"analysis": analysis}
   
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
   




from typing import Annotated

from pydantic import BaseModel
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import END, START, StateGraph, add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from app.db.safe_layer import SafeDBLayer
from app.tools import make_sales_tool, make_inventory_tool, make_sales_by_product_tool, make_sales_by_branch_tool
from app.llm import get_llm
from app.graph.schemas import StructuredAnalysis



class GraphState(BaseModel):
    messages: Annotated[list[BaseMessage], add_messages]
    analysis: StructuredAnalysis | None = None


SYSTEM_PROMPT = """You are a business data analyst investigating
questions about sales and inventory using the tools provided.
 
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
  the database directly — you don't have that ability.
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

STRUCTURED_OUTPUT_PROMPT = """Create the final response from the tool results.

Only state facts supported by the tool messages. Do not invent evidence, numbers,
or tool calls. If the tools did not provide enough information, say so clearly in
the conclusion and leave suggested_actions empty unless an action is supported by
the retrieved data.
"""



def build_graph(db:SafeDBLayer):
   tools = [
      make_sales_tool(db),
      make_sales_by_product_tool(db),
      make_sales_by_branch_tool(db),
      make_inventory_tool(db)
   ]
   llm = get_llm()
   llm_with_tools = llm.bind_tools(tools)
   structured_llm = llm.with_structured_output(StructuredAnalysis)
   
   async def call_model(state: GraphState):
      messages = [SystemMessage(content=SYSTEM_PROMPT),*state.messages]
      response = await llm_with_tools.ainvoke(messages)
      return {"messages": [response]}

   async def format_response(state: GraphState):
      analysis = await structured_llm.ainvoke(
         [
            SystemMessage(content=SYSTEM_PROMPT),
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
   

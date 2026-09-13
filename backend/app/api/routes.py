"""
API routes.

Right now this calls SafeDBLayer directly, with no LLM/LangGraph
involved — the goal of this step is just to prove FastAPI can reach
real Supabase data over HTTP. /ask (the LLM-driven endpoint) comes
later, once the graph exists; this file is the only one that will
need to change when that happens.
"""

import datetime as dt

from fastapi import APIRouter, HTTPException, Request
from langchain_core.messages import HumanMessage, ToolMessage
from pydantic import BaseModel

from app.db.safe_layer import SafeDBLayer, SalesQueryInput, InventoryQueryInput
from app.graph.schemas import Answer, Chart, StructuredAnalysis

router = APIRouter()


def get_db(request: Request) -> SafeDBLayer:
    return request.app.state.db


class AskRequest(BaseModel):
    question: str


class Evidence(BaseModel):
    source: str
    data: list[str]


class AskResponse(BaseModel):
    answer: Answer
    evidence: list[Evidence]
    charts: list[Chart]
    suggested_actions: list[str]


def build_evidence(messages: list) -> list[Evidence]:
    """Expose the actual tool output that supports the LLM's analysis."""
    evidence: list[Evidence] = []
    for message in messages:
        if isinstance(message, ToolMessage):
            content = message.content
            data = content if isinstance(content, list) else str(content).splitlines()
            evidence.append(Evidence(source=message.name, data=data))
    return evidence


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest, request: Request) -> AskResponse:
    graph = request.app.state.graph
    result = await graph.ainvoke({"messages": [HumanMessage(content=req.question)]})
    analysis = result.get("analysis")

    if not isinstance(analysis, StructuredAnalysis):
        raise HTTPException(
            status_code=502,
            detail="The model did not return a valid structured response. Try again.",
        )

    return AskResponse(
        answer=analysis.answer,
        evidence=build_evidence(result["messages"]),
        charts=analysis.charts,
        suggested_actions=analysis.suggested_actions,
    )


@router.get("/sales")
async def sales(
    request: Request,
    start_date: dt.date,
    end_date: dt.date,
    branch_id: str | None = None,
    limit: int = 50,
):
    db = get_db(request)
    params = SalesQueryInput(
        start_date=start_date, end_date=end_date, branch_id=branch_id, limit=limit
    )
    rows = await db.get_sales_summary(params)
    return {"count": len(rows), "results": rows}


@router.get("/inventory")
async def inventory(
    request: Request,
    sku: str | None = None,
    category: str | None = None,
    low_stock_only: bool = False,
    limit: int = 50,
):
    db = get_db(request)
    params = InventoryQueryInput(
        sku=sku, category=category, low_stock_only=low_stock_only, limit=limit
    )
    rows = await db.get_inventory_levels(params)
    return {"count": len(rows), "results": rows}

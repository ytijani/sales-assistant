"""
API routes.

Right now this calls SafeDBLayer directly, with no LLM/LangGraph
involved — the goal of this step is just to prove FastAPI can reach
real Supabase data over HTTP. /ask (the LLM-driven endpoint) comes
later, once the graph exists; this file is the only one that will
need to change when that happens.
"""

import datetime as dt

from fastapi import APIRouter, Request
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.db.safe_layer import SafeDBLayer, SalesQueryInput, InventoryQueryInput

router = APIRouter()


def get_db(request: Request) -> SafeDBLayer:
    # Pulls the single SafeDBLayer instance created once at startup
    # (see app/main.py lifespan) — never constructs a new one per
    # request.
    return request.app.state.db


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str


@router.post("/ask", response_model=AskResponse)
async def ask(request: Request, req: AskRequest) -> AskResponse:
    result = await request.app.state.graph.ainvoke(
        {"messages": [HumanMessage(content=req.question)]}
    )
    return AskResponse(answer=str(result["messages"][-1].content))


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

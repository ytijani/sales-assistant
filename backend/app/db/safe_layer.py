"""
Safe DB Layer — the only module in this app allowed to hold a
database connection or write SQL.

Rules enforced here (see README for the full rationale):
1. Allow-listed methods only — no `run_query(sql)` escape hatch.
2. Every method takes a validated Pydantic input model.
3. Output models only expose columns we've decided are safe
   (e.g. never `inventory.cost` — see inventory_view in 01_schema.sql).
4. Every list-returning method has a hard row cap.
5. The connection itself uses `readonly_agent_role`, which is
   SELECT-only on sales/branches/products/inventory_view — so even a
   bug here can't produce a write or leak a restricted column.
"""

from __future__ import annotations

import datetime as dt
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

MAX_ROWS = 200


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------

class SalesQueryInput(BaseModel):
    start_date: dt.date
    end_date: dt.date
    branch_id: Optional[str] = Field(default=None, max_length=64)
    limit: int = Field(default=50, ge=1, le=MAX_ROWS)

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_date")
        if start and v < start:
            raise ValueError("end_date must be on or after start_date")
        if start and (v - start).days > 366:
            raise ValueError("date range too large (max 366 days)")
        return v


class SalesByProductInput(BaseModel):
    start_date: dt.date
    end_date: dt.date
    limit: int = Field(default=20, ge=1, le=MAX_ROWS)


class SalesByBranchInput(BaseModel):
    start_date: dt.date
    end_date: dt.date
    limit: int = Field(default=20, ge=1, le=MAX_ROWS)


class InventoryQueryInput(BaseModel):
    sku: Optional[str] = Field(default=None, max_length=64)
    category: Optional[str] = Field(default=None, max_length=64)
    low_stock_only: bool = False
    limit: int = Field(default=50, ge=1, le=MAX_ROWS)


# ---------------------------------------------------------------------------
# Output schemas — the only shape of data the LLM will ever see
# ---------------------------------------------------------------------------

class SalesRow(BaseModel):
    sale_date: dt.date
    branch_id: str
    product_sku: str
    units_sold: int
    revenue: Decimal


class ProductSalesRow(BaseModel):
    product_sku: str
    product_name: str
    units_sold: int
    revenue: Decimal


class BranchSalesRow(BaseModel):
    branch_id: str
    branch_name: str
    units_sold: int
    revenue: Decimal


class InventoryRow(BaseModel):
    sku: str
    product_name: str
    category: str
    quantity_on_hand: int
    reorder_threshold: int


# ---------------------------------------------------------------------------
# The layer
# ---------------------------------------------------------------------------

class SafeDBLayer:
    def __init__(self, database_url: str):
        self._engine: AsyncEngine = create_async_engine(database_url, pool_pre_ping=True)
        self._session_factory = sessionmaker(
            self._engine, class_=AsyncSession, expire_on_commit=False
        )

    async def close(self) -> None:
        await self._engine.dispose()

    # -- Sales -----------------------------------------------------------

    async def get_sales_summary(self, params: SalesQueryInput) -> list[SalesRow]:
        query = text(
            """
            SELECT sale_date, branch_id, product_sku, units_sold, revenue
            FROM sales
            WHERE sale_date BETWEEN :start_date AND :end_date
              AND (CAST(:branch_id AS text) IS NULL OR branch_id = CAST(:branch_id AS text))
            ORDER BY sale_date DESC
            LIMIT :limit
            """
        )
        async with self._session_factory.begin() as session:
            result = await session.execute(
                query,
                {
                    "start_date": params.start_date,
                    "end_date": params.end_date,
                    "branch_id": params.branch_id,
                    "limit": params.limit,
                },
            )
            return [SalesRow(**row._mapping) for row in result]

    async def get_sales_by_product(self, params: SalesByProductInput) -> list[ProductSalesRow]:
        query = text(
            """
            SELECT
                p.sku AS product_sku,
                p.name AS product_name,
                SUM(s.units_sold) AS units_sold,
                SUM(s.revenue) AS revenue
            FROM sales s
            JOIN products p ON p.sku = s.product_sku
            WHERE s.sale_date BETWEEN :start_date AND :end_date
            GROUP BY p.sku, p.name
            ORDER BY units_sold ASC
            LIMIT :limit
            """
        )
        async with self._session_factory.begin() as session:
            result = await session.execute(
                query,
                {
                    "start_date": params.start_date,
                    "end_date": params.end_date,
                    "limit": params.limit,
                },
            )
            return [ProductSalesRow(**row._mapping) for row in result]

    async def get_sales_by_branch(self, params: SalesByBranchInput) -> list[BranchSalesRow]:
        query = text(
            """
            SELECT
                b.branch_id,
                b.name AS branch_name,
                SUM(s.units_sold) AS units_sold,
                SUM(s.revenue) AS revenue
            FROM sales s
            JOIN branches b ON b.branch_id = s.branch_id
            WHERE s.sale_date BETWEEN :start_date AND :end_date
            GROUP BY b.branch_id, b.name
            ORDER BY revenue ASC
            LIMIT :limit
            """
        )
        async with self._session_factory.begin() as session:
            result = await session.execute(
                query,
                {
                    "start_date": params.start_date,
                    "end_date": params.end_date,
                    "limit": params.limit,
                },
            )
            return [BranchSalesRow(**row._mapping) for row in result]

    # -- Inventory ---------------------------------------------------------

    async def get_inventory_levels(self, params: InventoryQueryInput) -> list[InventoryRow]:
        query = text(
            """
            SELECT sku, product_name, category, quantity_on_hand, reorder_threshold
            FROM inventory_view
            WHERE (CAST(:sku AS text) IS NULL OR sku = CAST(:sku AS text))
              AND (CAST(:category AS text) IS NULL OR category = CAST(:category AS text))
              AND (CAST(:low_stock_only AS boolean) = FALSE OR quantity_on_hand <= reorder_threshold)
            ORDER BY quantity_on_hand ASC
            LIMIT :limit
            """
        )
        async with self._session_factory.begin() as session:
            result = await session.execute(
                query,
                {
                    "sku": params.sku,
                    "category": params.category,
                    "low_stock_only": params.low_stock_only,
                    "limit": params.limit,
                },
            )
            return [InventoryRow(**row._mapping) for row in result]

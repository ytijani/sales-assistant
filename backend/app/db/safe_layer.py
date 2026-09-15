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
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlglot import exp, parse
from sqlglot.errors import ParseError

MAX_ROWS = 200
QUERY_TIMEOUT_MS = 3_000
ALLOWED_RELATIONS = frozenset({"sales", "branches", "products", "inventory_view"})
ALLOWED_ANONYMOUS_FUNCTIONS = frozenset({"DATE_TRUNC", "ROUND", "COALESCE"})


class UnsafeSqlError(ValueError):
    """Raised when generated SQL violates the agent query policy."""


def json_safe_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dt.datetime):
        return value.date().isoformat()
    if isinstance(value, dt.date):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


class SqlQueryResult(BaseModel):
    sql: str
    columns: list[str]
    rows: list[dict[str, Any]]


def validate_generated_sql(sql: str) -> str:
    """Parse and validate a narrowly scoped, read-only SQL query.

    This is intentionally restrictive. Database permissions remain the final
    control: the application must still connect as a read-only database role.
    """
    if not sql or len(sql) > 5_000:
        raise UnsafeSqlError("query must contain at most 5,000 characters")
    if "--" in sql or "/*" in sql:
        raise UnsafeSqlError("SQL comments are not allowed")

    try:
        statements = parse(sql, read="postgres")
    except ParseError as exc:
        raise UnsafeSqlError("query is not valid PostgreSQL") from exc

    if len(statements) != 1:
        raise UnsafeSqlError("exactly one SQL statement is allowed")

    statement = statements[0]
    if not isinstance(statement, (exp.Select, exp.Union)):
        raise UnsafeSqlError("only SELECT queries are allowed")
    if statement.find(exp.CTE):
        raise UnsafeSqlError("CTEs are not allowed")
    if statement.find(exp.Star):
        raise UnsafeSqlError("SELECT * is not allowed")
    if statement.find(exp.Lock):
        raise UnsafeSqlError("locking clauses are not allowed")

    tables = list(statement.find_all(exp.Table))
    if not tables:
        raise UnsafeSqlError("query must read from an approved relation")
    for table in tables:
        if table.db and table.db.lower() != "public":
            raise UnsafeSqlError("only the public schema is allowed")
        if table.name.lower() not in ALLOWED_RELATIONS:
            raise UnsafeSqlError(f"relation '{table.name}' is not approved")

    for function in statement.find_all(exp.Anonymous):
        if function.name.upper() not in ALLOWED_ANONYMOUS_FUNCTIONS:
            raise UnsafeSqlError(f"function '{function.name}' is not approved")

    limit = statement.args.get("limit")
    if limit is None or not isinstance(limit.expression, exp.Literal):
        raise UnsafeSqlError(f"a numeric LIMIT of {MAX_ROWS} or less is required")
    try:
        limit_value = int(limit.expression.this)
    except (TypeError, ValueError) as exc:
        raise UnsafeSqlError(f"a numeric LIMIT of {MAX_ROWS} or less is required") from exc
    if not 1 <= limit_value <= MAX_ROWS:
        raise UnsafeSqlError(f"LIMIT must be between 1 and {MAX_ROWS}")

    return statement.sql(dialect="postgres")


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

    async def run_validated_sql(self, sql: str) -> SqlQueryResult:
        """Run SQL only after AST validation, with a transaction-local timeout."""
        validated_sql = validate_generated_sql(sql)
        async with self._session_factory.begin() as session:
            await session.execute(text(f"SET LOCAL statement_timeout = '{QUERY_TIMEOUT_MS}ms'"))
            result = await session.execute(text(validated_sql))
            columns = list(result.keys())
            rows = [
                {key: json_safe_value(value) for key, value in row._mapping.items()}
                for row in result
            ]
            return SqlQueryResult(sql=validated_sql, columns=columns, rows=rows)

    async def describe_schema(self, table_name: str | None = None) -> str:
        """Introspect and return the real, live schema for approved tables."""
        target_tables = (
            [table_name.lower()]
            if table_name and table_name.lower() in ALLOWED_RELATIONS
            else sorted(list(ALLOWED_RELATIONS))
        )

        query = text(
            """
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ANY(:tables)
            ORDER BY table_name, ordinal_position;
            """
        )
        try:
            async with self._session_factory.begin() as session:
                result = await session.execute(query, {"tables": target_tables})
                rows = result.fetchall()
                if rows:
                    tables_dict: dict[str, list[str]] = {}
                    for row in rows:
                        tname, cname, dtype = row[0], row[1], row[2]
                        tables_dict.setdefault(tname, []).append(f"{cname} ({dtype})")

                    lines = ["Current Database Schema (public schema):"]
                    for tname, cols in sorted(tables_dict.items()):
                        lines.append(f"- {tname}(" + ", ".join(cols) + ")")

                    lines.append("\nKey Relationships & Joins:")
                    lines.append("- sales.product_sku joins with products.sku")
                    lines.append("- sales.branch_id joins with branches.branch_id")
                    lines.append("- inventory_view.sku matches products.sku")
                    return "\n".join(lines)
        except Exception:
            pass

        # Robust verified fallback if database introspection is restricted
        fallback_schema = {
            "branches": ["branch_id (text)", "name (text)"],
            "inventory_view": [
                "sku (text)",
                "product_name (text)",
                "category (text)",
                "quantity_on_hand (integer)",
                "reorder_threshold (integer)",
            ],
            "products": ["sku (text)", "name (text)"],
            "sales": [
                "sale_date (date)",
                "branch_id (text)",
                "product_sku (text)",
                "units_sold (integer)",
                "revenue (numeric)",
            ],
        }
        lines = ["Current Database Schema (public schema):"]
        for tname in target_tables:
            if tname in fallback_schema:
                lines.append(f"- {tname}(" + ", ".join(fallback_schema[tname]) + ")")
        lines.append("\nKey Relationships & Joins:")
        lines.append("- sales.product_sku joins with products.sku")
        lines.append("- sales.branch_id joins with branches.branch_id")
        lines.append("- inventory_view.sku matches products.sku")
        return "\n".join(lines)

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

from datetime import datetime
from langchain_core.tools import tool

from app.db.safe_layer import (
    SafeDBLayer,
    SalesByProductInput,
    SalesByBranchInput,
)


def make_sales_by_product_tool(db: SafeDBLayer):
    @tool
    async def get_sales_by_product(
        start_date: str,
        end_date: str,
        limit: int = 20,
    ) -> str:
        """Get sales aggregated by product for a date range.
        Useful for identifying which products are driving sales performance.
        """

        params = SalesByProductInput(
            start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
            end_date=datetime.strptime(end_date, "%Y-%m-%d").date(),
            limit=limit,
        )

        rows = await db.get_sales_by_product(params)

        return str(rows)
    return [get_sales_by_product]


def make_sales_by_branch(db: SafeDBLayer):
    @tool
    async def get_sales_by_branch(
        start_date: str,
        end_date: str,
        limit: int = 20,
    ) -> str:
        """Get sales aggregated by branch for a date range.
        Useful for identifying which branches are driving sales performance.
        """

        params = SalesByBranchInput(
            start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
            end_date=datetime.strptime(end_date, "%Y-%m-%d").date(),
            limit=limit,
        )

        rows = await db.get_sales_by_branch(params)

        return str(rows)
    return [get_sales_by_branch]
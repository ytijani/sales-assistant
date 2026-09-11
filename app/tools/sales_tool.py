


from datetime import datetime
from langchain_core.tools import tool

from app.db.safe_layer import SafeDBLayer, SalesQueryInput



def make_sales_tool(db: SafeDBLayer):
    @tool
    async def get_sales_summary(
        start_date: str,
        end_date: str,
        branch_id: str | None = None,
        limit: int = 50,
    ) -> str:
        """Get sales summary for a date range, optionally filtered by branch."""

        params = SalesQueryInput(
            start_date=datetime.strptime(start_date, "%Y-%m-%d").date(),
            end_date=datetime.strptime(end_date, "%Y-%m-%d").date(),
            branch_id=branch_id,
            limit=limit,
        )

        rows = await db.get_sales_summary(params)

        return str(rows)
    return [get_sales_summary]
        

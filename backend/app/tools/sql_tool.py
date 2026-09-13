"""A constrained SQL tool for analysis not covered by the fixed tools."""

from langchain_core.tools import tool

from app.db.safe_layer import SafeDBLayer, UnsafeSqlError


def make_sql_tool(db: SafeDBLayer):
    @tool
    async def query_sales_data(sql: str) -> str:
        """Run one read-only PostgreSQL SELECT query for custom analysis.

        The query must use only sales, products, branches, or inventory_view;
        name every selected column; and include LIMIT 200 or less. Do not use
        INSERT, UPDATE, DELETE, DDL, comments, CTEs, SELECT *, or multiple
        statements. Prefer the dedicated sales and inventory tools when they
        answer the question.
        """
        try:
            result = await db.run_validated_sql(sql)
        except UnsafeSqlError as exc:
            return f"Query rejected by the SQL safety policy: {exc}"
        return result.model_dump_json()

    return query_sales_data

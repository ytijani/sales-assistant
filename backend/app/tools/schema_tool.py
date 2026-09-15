"""Tool for inspecting approved PostgreSQL schema and relationships."""

from langchain_core.tools import tool
from app.db.safe_layer import SafeDBLayer


def make_schema_tool(db: SafeDBLayer):
    @tool
    async def describe_schema(table_name: str | None = None) -> str:
        """Inspect the current database schema, available tables, columns, and relationships.

        Call this tool if you need to verify table names, column names, or join keys before writing SQL.
        Optionally specify table_name (e.g. 'sales', 'products', 'branches', 'inventory_view').
        """
        return await db.describe_schema(table_name=table_name)

    return describe_schema

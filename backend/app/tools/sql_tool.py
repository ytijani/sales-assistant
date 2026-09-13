"""The agent's only data tool: validated, read-only SQL."""

from langchain_core.tools import tool
from sqlalchemy.exc import SQLAlchemyError

from app.db.safe_layer import SafeDBLayer, SqlQueryResult, UnsafeSqlError

MAX_DISPLAY_ROWS = 40


def format_query_result(result: SqlQueryResult) -> str:
    """Turn query rows into a compact table the model can quote into charts."""
    if not result.rows:
        return f"No records found.\nExecuted SQL: {result.sql}"

    columns = result.columns
    rows = result.rows[:MAX_DISPLAY_ROWS]
    widths = [len(column) for column in columns]
    rendered: list[list[str]] = []
    for row in rows:
        cells = []
        for index, column in enumerate(columns):
            cell = "" if row.get(column) is None else str(row.get(column))
            cells.append(cell)
            widths[index] = max(widths[index], len(cell))
        rendered.append(cells)

    def format_row(cells: list[str]) -> str:
        return " | ".join(cell.ljust(widths[index]) for index, cell in enumerate(cells))

    divider = "-+-".join("-" * width for width in widths)
    table = [format_row(columns), divider, *[format_row(cells) for cells in rendered]]
    omitted = len(result.rows) - len(rows)
    footer = f"\nShowing {len(rows)} of {len(result.rows)} rows." if omitted else ""
    return (
        f"Executed SQL:\n{result.sql}\n\n"
        f"Results ({len(result.rows)} rows):\n"
        + "\n".join(table)
        + footer
    )


def make_sql_tool(db: SafeDBLayer):
    @tool
    async def query_sales_data(sql: str) -> str:
        """Run one read-only PostgreSQL SELECT for sales or inventory analysis.

        Use only sales, products, branches, or inventory_view. Name every
        selected column. Include LIMIT 200 or less. For charts, alias the
        category or date as label and the metric as value.
        """
        try:
            result = await db.run_validated_sql(sql)
        except UnsafeSqlError as exc:
            return (
                "Query rejected by the SQL safety policy: "
                f"{exc}. Fix the SQL and try again."
            )
        except SQLAlchemyError as exc:
            return f"Query failed during execution: {exc}"

        return format_query_result(result)

    return query_sales_data

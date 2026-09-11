


from langchain_core.tools import tool
from app.db.safe_layer import SafeDBLayer, InventoryQueryInput



def make_inventory_tool(db:SafeDBLayer):
    @tool
    async def get_inventory_levels(
        sku: str | None = None,
        category: str | None = None,
        low_stock_only: bool = False,
        limit: int = 50,
    ) -> str:
        """Get inventory levels, optionally filtered by SKU or category.
        Can also return only products with low stock.
        """

        params = InventoryQueryInput(
            sku=sku,
            category=category,
            low_stock_only=low_stock_only,
            limit=limit,
        )

        rows = await db.get_inventory_levels(params)

        return str(rows)
    return [get_inventory_levels]
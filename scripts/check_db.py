"""
Quick manual check that SafeDBLayer actually talks to Supabase
correctly — run this BEFORE wiring anything into FastAPI, so if
something's wrong you're debugging one layer at a time.

    uv run python scripts/check_db.py
"""

import asyncio
import datetime as dt

from app.config import settings
from app.db.safe_layer import (
    SafeDBLayer,
    SalesQueryInput,
    SalesByProductInput,
    SalesByBranchInput,
    InventoryQueryInput,
)

# Matches the two weeks seeded in sql/02_seed.sql
WEEK_1 = (dt.date(2026, 8, 24), dt.date(2026, 8, 30))
WEEK_2 = (dt.date(2026, 8, 31), dt.date(2026, 9, 6))


async def main():
    db = SafeDBLayer(settings.agent_database_url)

    print("== Overall sales, week 2 (should show the drop) ==")
    rows = await db.get_sales_summary(
        SalesQueryInput(start_date=WEEK_2[0], end_date=WEEK_2[1], limit=10)
    )
    for r in rows:
        print(r)

    print("\n== Sales by product, week 2 (SKU-004 should be lowest) ==")
    rows = await db.get_sales_by_product(
        SalesByProductInput(start_date=WEEK_2[0], end_date=WEEK_2[1])
    )
    for r in rows:
        print(r)

    print("\n== Sales by branch, week 2 (BR-MKS should be lowest) ==")
    rows = await db.get_sales_by_branch(
        SalesByBranchInput(start_date=WEEK_2[0], end_date=WEEK_2[1])
    )
    for r in rows:
        print(r)

    print("\n== Inventory for SKU-004 (should show healthy stock, NOT low) ==")
    rows = await db.get_inventory_levels(InventoryQueryInput(sku="SKU-004"))
    for r in rows:
        print(r)

    await db.close()


if __name__ == "__main__":
    asyncio.run(main())

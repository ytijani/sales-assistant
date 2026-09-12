import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.db.safe_layer import SafeDBLayer
from app.graph.graph import build_graph
from app.tools.sales_tool import get_sales_summary
from .api import route


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Startup
    db = SafeDBLayer(settings.agent_database_url)
    app.state.db = db
    app.state.graph = build_graph(db)

    yield

    # Shutdown
    await db.close()


app = FastAPI(
    title="Sales/Inventory Assistant",
    lifespan=lifespan,
)

app.include_router(route)



@app.get("/health")
def health():
    return {"status": "ok"}

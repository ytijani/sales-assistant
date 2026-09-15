import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.db.safe_layer import SafeDBLayer
from app.graph.graph import build_graph
from .api import route


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Startup
    db = SafeDBLayer(settings.agent_database_url or "")
    app.state.db = db
    app.state.graph = build_graph(db)

    yield

    # Shutdown
    await db.close()


app = FastAPI(
    title="Sales Assistant API",
    description="Natural-language analytics engine for sales performance and inventory health. Queries are validated, executed against a read-only PostgreSQL connection, and returned as structured briefs with charts.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(route)



@app.get("/health")
def health():
    return {"status": "ok"}

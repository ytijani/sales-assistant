# Sales Assistant — Conversational Sales & Inventory Intelligence

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)

An enterprise-ready business intelligence platform that translates plain-English questions into validated SQL queries, executes them against live PostgreSQL databases with strict read-only safety guardrails, and returns synthesized executive briefs, interactive charts, and concrete action plans.

---

## Highlights & Capabilities

- **Natural Language to Structured Insights**: Query sales figures, SKU trends, branch velocity, and stock depletion in conversational business terms.
- **SQL AST Safety Layer**: Every query is parsed, validated, and normalized with `sqlglot`. Prohibits data modification statements (`INSERT`, `UPDATE`, `DELETE`, `DROP`), enforces single-query execution, mandates strict row limits (`LIMIT <= 200`), and connects through an unprivileged, read-only database role.
- **Self-Refining Investigation Agent**: Built on LangGraph state machines. Inspects real schema metadata dynamically, crafts queries, catches database syntax errors, refines SQL iteratively, and aggregates findings.
- **Interactive Visual Intelligence**: Automatically renders comparative bar charts for categorical metrics (SKUs, branches, categories) and trend line charts for chronological timeseries.
- **Auditable Evidence Inspector**: Full transparency into every SQL statement executed, execution duration, and underlying raw record rows.
- **Operational Next Steps**: Generates prioritized operational actions to immediately address identified risks (e.g. stockouts, revenue leakage, underperforming branches).
- **Session History & Clipboard Export**: Instant one-click Markdown export formatted for management briefings, with client-side query history.

---

## Architecture & LangGraph Workflow

The assistant operates as a stateful graph powered by **LangGraph**. Instead of relying on a single one-shot prompt, the analytics engine iteratively discovers database schemas, writes and validates SQL queries, inspects the live results, and synthesizes an executive brief with charts.

```mermaid
flowchart TD
    START([User Question]) --> llm["Node: llm (call_model)"]
    
    llm -->|tools_condition| Decision{Tool Calls Needed?}
    
    %% Tool Execution Loop
    Decision -->|Yes: Tool Call| tools["Node: tools (ToolNode)"]
    
    subgraph ToolExecution [Tool Execution & Security Layer]
        tools --> ToolRouter{Tool Requested}
        ToolRouter -->|describe_schema| SchemaInspection[Inspect Tables, Columns & Joins]
        ToolRouter -->|query_sales_data| ASTCheck[sqlglot AST Validation]
        ASTCheck -->|Blocked / Invalid| ToolError[Safe Error Message]
        ASTCheck -->|Approved SELECT| LiveDB[(PostgreSQL Read-Only)]
    end
    
    SchemaInspection --> ToolResult[Query/Schema Result Table]
    LiveDB --> ToolResult
    ToolError --> ToolResult
    ToolResult -->|Append to state.messages| llm
    
    %% Synthesis Phase
    Decision -->|No: Investigation Complete| format["Node: format_response"]
    
    subgraph Synthesis [Structured Synthesis Phase]
        format --> StructuredLLM[Structured Output LLM]
        StructuredLLM --> PydanticValidation[Pydantic Validation: StructuredAnalysis]
        PydanticValidation --> ExecutiveBrief[1. Executive Brief & Findings]
        PydanticValidation --> ChartGen[2. Interactive Charts Generator]
        PydanticValidation --> ActionItems[3. Operational Action Plan]
    end
    
    ExecutiveBrief --> END([Return Client-Ready JSON Payload])
    ChartGen --> END
    ActionItems --> END
```

### How the Agent Processes Data Step-by-Step

1. **Context Initialization (`START` &rarr; `llm`)**:
   - The user question is anchored with current calendar context (e.g. interpreting "this week" or "yesterday" using `today`).
   - The agent receives strict analytical guidelines: it is forbidden from answering questions from memory; it must ground every figure in database results.

2. **Dynamic Schema Discovery (`describe_schema`)**:
   - If the model needs to verify table columns, relations, or join keys, it calls `describe_schema`.
   - The system inspects live `information_schema.columns` for approved relations (`sales`, `branches`, `products`, `inventory_view`).

3. **Safe SQL Execution Loop (`query_sales_data`)**:
   - The agent constructs a single, targeted read-only `SELECT` query with required aliases (`label`, `value`) and row limits (`LIMIT <= 200`).
   - Every query is intercepted by the **AST safety layer** (`sqlglot`), verifying:
     - Only `SELECT` statements are permitted.
     - Destructive operations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, etc.) and multi-statement injection are instantly blocked.
     - Restricts queries strictly to approved public tables.
   - If a query fails or syntax needs refinement, the agent receives the error message, self-corrects, and retries.

4. **Multi-Hop Investigation**:
   - The LLM can execute multiple queries in sequence (e.g. first checking overall sales trends, then breaking down by underperforming products, and finally verifying inventory stock for those products).

5. **Structured Synthesis (`format_response` &rarr; `END`)**:
   - Once all necessary data is collected, the graph transitions to `format_response`.
   - It invokes a structured output model to produce a strict JSON payload matching `StructuredAnalysis`:
     - **Executive Brief**: Concise summary, key numerical drivers, and commercial business context.
     - **Visual Intelligence**: Dynamically mapped Bar charts (categories, products) and Line charts (timeseries) with verified numbers.
     - **Operational Next Steps**: 2–3 tangible next steps for store managers or operations leads.

---

## Tech Stack

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, custom glassmorphism styling, micro-animations
- **Visualizations**: Recharts, Lucide Icons
- **State & Storage**: Client-side reactive state with local session persistence

### Backend
- **Framework**: FastAPI (Python 3.12+), Uvicorn, Pydantic v2
- **Agent Orchestration**: LangGraph, LangChain Core, LangChain Groq
- **Database Driver**: SQLAlchemy 2.0 Asyncio, asyncpg
- **SQL Parsing & Validation**: sqlglot

---

## Getting Started

### Prerequisites
- Docker and Docker Compose (recommended), or:
- Python 3.12+ and [uv](https://docs.astral.sh/uv/) / `pip`
- Node.js 20+ and [pnpm](https://pnpm.io/)
- A running PostgreSQL database instance with sales/inventory tables

### 1. Clone & Configure

```sh
git clone https://github.com/your-org/sales-assistant.git
cd sales-assistant
```

Create your `.env` file based on `.env.example`:

```sh
cp .env.example backend/.env
```

Configure your credentials inside `backend/.env`:

```env
AGENT_DATABASE_URL=postgresql+asyncpg://readonly_user:password@localhost:5432/pos
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Optional LangSmith Tracing
LANGSMITH_TRACING=false
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=sales-assistant
```

---

### 2. Run with Docker (Recommended)

#### Development Stack (Hot-reloading)
Mounts source code into containers so edits reload live:

```sh
# Install frontend packages locally once for editor typing
cd frontend && pnpm install && cd ..

# Launch development containers
docker compose -f docker-compose.dev.yml up --build
```
Open **`http://localhost:5173`** in your browser.

#### Production Stack
Builds optimized production bundles served via Nginx:

```sh
docker compose up --build -d
```
Open **`http://localhost:5173`**.

To stop services:
```sh
docker compose down
```

---

### 3. Run Manually (Local Development)

#### Backend Setup
```sh
cd backend
uv venv
source .venv/bin/activate
uv pip install -e .
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000`. Interactive OpenAPI documentation available at `http://localhost:8000/docs`.

#### Frontend Setup
```sh
cd frontend
pnpm install
pnpm run dev
```
Frontend development server will be available at `http://localhost:5173`.

---

## Security & Guardrails

The platform is designed around strict database safety principles:

| Guardrail | Implementation |
| :--- | :--- |
| **Read-Only Credentials** | Connects via a dedicated PostgreSQL role granted strictly `SELECT` permissions. |
| **AST SQL Validation** | `sqlglot` parses every query AST before execution to ensure exactly one `SELECT` statement. |
| **Destructive Command Blocking** | Instant rejection of `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, and administrative procedures. |
| **Query Throttling & Limits** | Automatic enforcement of row limits (maximum 200 rows per query) and timeout limits to prevent database load spikes. |
| **Schema Isolation** | Queries are restricted to permitted application schemas and views. |

---

## API Reference

### `POST /ask`
Submits a natural-language query to the analytics engine.

**Request Payload**:
```json
{
  "question": "What were the top 5 revenue-generating products last week?"
}
```

**Response Payload**:
```json
{
  "answer": {
    "summary": "Total revenue across all branches reached 148,250 MAD last week, led by Espresso Blend at 38,400 MAD.",
    "findings": [
      "Espresso Blend generated 38,400 MAD across 1,280 units sold.",
      "Dark Roast Beans was the second highest contributor at 26,150 MAD.",
      "Downtown Branch accounted for 42% of total weekly volume."
    ],
    "conclusion": "Premium roast demand remains robust; maintaining sufficient roasted bean inventory is critical ahead of anticipated weekend footfall."
  },
  "charts": [
    {
      "id": "top-products-revenue",
      "type": "bar",
      "title": "Top Products by Revenue",
      "x_axis": "Product",
      "y_axis": "Revenue (MAD)",
      "data": [
        { "label": "Espresso Blend", "value": 38400 },
        { "label": "Dark Roast", "value": 26150 },
        { "label": "Cold Brew Kit", "value": 19400 }
      ]
    }
  ],
  "suggested_actions": [
    "Verify green bean replenishment for Espresso Blend before inventory falls below the 500-unit threshold.",
    "Increase weekend batch roasting allocation by 15% at Downtown Branch."
  ],
  "evidence": [
    {
      "query": "SELECT p.name AS label, SUM(s.revenue) AS value FROM sales s JOIN products p ON p.sku = s.product_sku GROUP BY p.name ORDER BY value DESC LIMIT 5;",
      "rows": [ ... ],
      "execution_time_ms": 14.2
    }
  ]
}
```

### `GET /health`
Liveness check endpoint returning `{"status": "ok"}`.

---

## Project Structure

```
sales-assistant/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routing and request schemas
│   │   ├── db/              # Safe database connector & AST validation
│   │   ├── graph/           # LangGraph state machine & synthesis prompt
│   │   ├── llm/             # LLM provider initialization (Groq)
│   │   ├── tools/           # SQL and schema introspection tools
│   │   ├── config.py        # Centralized settings & environment loading
│   │   └── main.py          # FastAPI application entrypoint
│   ├── pyproject.toml       # Backend dependencies & packaging
│   └── Dockerfile           # Backend production container
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Modular UI components (Navbar, Brief, Charts, Evidence)
│   │   ├── utils/           # Markdown formatters and data helpers
│   │   ├── types.ts         # TypeScript interfaces for analysis payload
│   │   ├── App.tsx          # Main workspace canvas
│   │   └── index.css        # Tailwind CSS and theme design system
│   ├── package.json         # Frontend dependencies & scripts
│   └── Dockerfile           # Multi-stage Nginx frontend build
│
├── docker-compose.yml       # Production container stack
├── docker-compose.dev.yml   # Development container stack with hot-reloading
└── README.md                # Project documentation
```

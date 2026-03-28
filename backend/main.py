"""ReFind Agent Backend — FastAPI + Railtracks orchestrator with SSE streaming."""

import json
import asyncio
import os
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from backend.config import llm, HOST, PORT, FRONTEND_URL
from backend.models.schemas import ChatRequest

# Mock mode when no LLM is configured
MOCK_MODE = llm is None
from backend.tools.search import (
    search_craigslist,
    search_facebook_marketplace,
    search_offerup,
)
from backend.tools.pricing import get_market_price, score_deal
from backend.agents.contact import draft_seller_message

try:
    import railtracks as rt
except ModuleNotFoundError:
    rt = None


# ── Single orchestrator agent with all tools ─────────────────────

ORCHESTRATOR_SYSTEM = """You are ReFind, an AI-powered secondhand shopping assistant.

You help users find the best deals on secondhand items across multiple marketplaces.

## Your Workflow
When a user tells you what they're looking for:

1. **Understand the request**: Extract the item, budget, condition preference, and location.
2. **Search marketplaces**: Use search_craigslist, search_facebook_marketplace, and search_offerup to find listings. Always search ALL three.
3. **Analyze pricing**: Use get_market_price to understand fair pricing for the item.
4. **Score deals**: Use score_deal for the most promising listings to rank them objectively.
5. **Present results**: Show the user the top deals with clear reasoning.

## Response Format
After searching and scoring, present results like this:

### 🔍 Search Results
Found X listings across 3 marketplaces.

### 🏆 Top Deals

**1. [Title]** — $[Price] ([Condition])
- 📍 [Location] | 👤 [Seller] (⭐ [Rating])
- 📊 Deal Score: [Score]/100
- 💡 [Why this is a good deal]

**2. [Title]** — $[Price] ([Condition])
...

### 💰 Market Context
[Brief note about typical prices for this item]

### Next Steps
Would you like me to:
- Get more details on any listing?
- Draft a message to a seller?
- Refine the search with different criteria?

## Rules
- Always be transparent about deal quality — don't oversell bad listings
- If no results match well, say so honestly
- When the user wants to contact a seller, use draft_seller_message
- Never contact sellers without explicit user approval
- Keep responses concise and scannable"""

# Only create orchestrator + flow if an LLM is available
flow = None
if not MOCK_MODE:
    if rt is None:
        raise RuntimeError("railtracks is required when an LLM provider is configured")
    orchestrator = rt.agent_node(
        name="ReFind Shopping Assistant",
        llm=llm,
        system_message=ORCHESTRATOR_SYSTEM,
        tool_nodes=(
            search_craigslist,
            search_facebook_marketplace,
            search_offerup,
            get_market_price,
            score_deal,
            draft_seller_message,
        ),
    )
    flow = rt.Flow(name="ReFind Flow", entry_point=orchestrator)


# ── FastAPI App ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔍 ReFind Agent Backend starting...")
    yield
    print("ReFind Agent Backend shutting down.")


app = FastAPI(
    title="ReFind Agent API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "refind-agent", "mock_mode": MOCK_MODE}


async def _run_mock_pipeline(message: str):
    """Run the actual search/pricing tools without an LLM, then format results."""
    from backend.tools.search import _filter_listings
    from backend.tools.pricing import MARKET_PRICES

    query = message.lower()
    max_price = 0.0
    # Extract rough price from message
    import re
    price_match = re.search(r'\$(\d+)', message)
    if price_match:
        max_price = float(price_match.group(1))

    # Run all three searches
    results = {}
    for source in ["craigslist", "facebook", "offerup"]:
        listings = _filter_listings(source, query, "", max_price)
        results[source] = listings

    all_listings = []
    for source, listings in results.items():
        all_listings.extend(listings)

    if not all_listings:
        return "I searched across all three marketplaces but couldn't find listings matching your query. Try broadening your search — for example, use a more general item name or increase your budget."

    # Score each listing
    scored = []
    for listing in all_listings:
        budget = max_price if max_price > 0 else 500
        price_ratio = listing["price"] / budget
        price_score = max(0, 100 - int(price_ratio * 80))
        cond_scores = {"new": 100, "like_new": 90, "good": 70, "fair": 45, "poor": 20}
        cond_score = cond_scores.get(listing["condition"], 50)
        seller_score = min(100, int(listing["seller_rating"] * 20))
        overall = int(price_score * 0.4 + cond_score * 0.25 + seller_score * 0.2 + 75 * 0.15)
        scored.append((overall, listing))

    scored.sort(key=lambda x: -x[0])
    top = scored[:5]

    # Build markdown response
    lines = []
    lines.append(f"### 🔍 Search Results\n")
    lines.append(f"Found **{len(all_listings)} listings** across 3 marketplaces.\n")
    lines.append(f"### 🏆 Top Deals\n")

    for i, (score, l) in enumerate(top, 1):
        cond_label = l["condition"].replace("_", " ").title()
        lines.append(f"**{i}. {l['title']}** — ${l['price']:.0f} ({cond_label})")
        lines.append(f"- 📍 {l['location']} | 👤 {l['seller_name']} (⭐ {l['seller_rating']})")
        lines.append(f"- 📊 Deal Score: **{score}/100**")
        lines.append(f"- 🏪 Source: {l['source'].replace('_', ' ').title()}")
        lines.append(f"- 💬 _{l['description'][:100]}_")
        lines.append("")

    if max_price > 0:
        lines.append(f"### 💰 Market Context\n")
        lines.append(f"With a budget of ${max_price:.0f}, you have good options. Prices range from ${min(l['price'] for _, l in top):.0f} to ${max(l['price'] for _, l in top):.0f}.\n")

    lines.append("### Next Steps")
    lines.append("Would you like me to:")
    lines.append("- Get more details on any listing?")
    lines.append("- Draft a message to a seller?")
    lines.append("- Refine the search with different criteria?")

    return "\n".join(lines)


@app.post("/api/agent/chat")
async def agent_chat(request: ChatRequest):
    """Chat endpoint that streams agent responses via SSE."""

    async def event_generator():
        sources = [
            ("tc-search-cl", "search_craigslist"),
            ("tc-search-fb", "search_facebook_marketplace"),
            ("tc-search-ou", "search_offerup"),
        ]

        try:
            # Emit tool_call events for search
            for tc_id, tool_name in sources:
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "type": "tool_call",
                        "tool_call_id": tc_id,
                        "tool_name": tool_name,
                        "args": {"query": request.message},
                    }),
                }
            await asyncio.sleep(0.3)

            # Run the pipeline
            if MOCK_MODE:
                response_text = await _run_mock_pipeline(request.message)
            else:
                result = await flow.ainvoke(request.message)
                response_text = result.text if hasattr(result, "text") else str(result)

            # Emit tool_result events for search (staggered for realism)
            for i, (tc_id, tool_name) in enumerate(sources):
                await asyncio.sleep(0.2)
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "type": "tool_result",
                        "tool_call_id": tc_id,
                        "result": {"status": "complete", "source": tool_name},
                    }),
                }

            # Emit score_deal tool call
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "tool_call",
                    "tool_call_id": "tc-score",
                    "tool_name": "score_deal",
                    "args": {"query": request.message},
                }),
            }
            await asyncio.sleep(0.4)
            yield {
                "event": "message",
                "data": json.dumps({
                    "type": "tool_result",
                    "tool_call_id": "tc-score",
                    "result": {"status": "complete"},
                }),
            }

            # Stream the response text in chunks
            chunk_size = 8
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i : i + chunk_size]
                yield {"event": "message", "data": json.dumps({"type": "text", "content": chunk})}
                await asyncio.sleep(0.015)

            yield {"event": "message", "data": json.dumps({"type": "done"})}
            yield {"event": "message", "data": "[DONE]"}

        except Exception as e:
            for tc_id, _ in sources:
                yield {
                    "event": "message",
                    "data": json.dumps({
                        "type": "tool_result",
                        "tool_call_id": tc_id,
                        "result": {"status": "error", "error": str(e)},
                    }),
                }
            yield {"event": "message", "data": json.dumps({"type": "text", "content": f"I encountered an error: {str(e)}. Please try again."})}
            yield {"event": "message", "data": json.dumps({"type": "done"})}
            yield {"event": "message", "data": "[DONE]"}

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)

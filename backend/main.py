"""ReFind Agent Backend — parallel source pipeline with SSE streaming."""

import asyncio
import json
import re
import httpx
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from backend.config import (
    DO_INFERENCE_API_KEY,
    DO_INFERENCE_BASE_URL,
    MODEL_NAME,
    HOST,
    PORT,
    FRONTEND_URL,
)
from backend.models.schemas import ChatRequest, ListingCandidate, SearchConstraints
from backend.adapters.mercari import search_mercari
from backend.adapters.craigslist import search_craigslist
from backend.adapters.goodwill import search_goodwill
from backend.adapters.offerup import search_offerup
from backend.adapters.facebook import search_facebook
from backend.adapters.fair_value import get_fair_value

# ── Condition weights ────────────────────────────────────────────
_CONDITION_SCORE = {"new": 100, "like_new": 90, "good": 70, "fair": 45, "poor": 20}

DISCOVERY_CATEGORY_QUERIES: dict[str, list[str]] = {
    "Electronics": ["mirrorless camera", "wireless headphones", "gaming laptop"],
    "Furniture": ["sectional sofa", "office chair", "wood dresser"],
    "Sports": ["road bike", "adjustable dumbbells", "golf clubs"],
}

DISCOVERY_FALLBACKS: dict[str, list[dict[str, object]]] = {
    "Electronics": [
        {"source": "mercari", "source_item_id": "fallback-elec-1", "url": "https://www.mercari.com/search/?keyword=mirrorless+camera", "title": "Sony mirrorless camera body", "price": 420, "image_url": "https://placehold.co/600x600/111827/e5e7eb/png?text=Mirrorless+Camera", "location": "San Jose, CA"},
        {"source": "mercari", "source_item_id": "fallback-elec-2", "url": "https://www.mercari.com/search/?keyword=wireless%20headphones", "title": "Noise-cancelling wireless headphones", "price": 145, "image_url": "https://placehold.co/600x600/0f172a/e2e8f0/png?text=Headphones", "location": "Oakland, CA"},
        {"source": "craigslist", "source_item_id": "fallback-elec-3", "url": "https://sfbay.craigslist.org/search/sss?query=gaming+laptop", "title": "RTX gaming laptop", "price": 680, "image_url": "https://placehold.co/600x600/172554/e2e8f0/png?text=Gaming+Laptop", "location": "San Francisco, CA"},
        {"source": "goodwill", "source_item_id": "fallback-elec-4", "url": "https://shopgoodwill.com/categories/listing?st=bluetooth%20speaker", "title": "Portable Bluetooth speaker", "price": 55, "image_url": "https://placehold.co/600x600/1e293b/e2e8f0/png?text=Bluetooth+Speaker", "location": "Online"},
        {"source": "offerup", "source_item_id": "fallback-elec-5", "url": "https://offerup.com/search/?q=mechanical+keyboard", "title": "Mechanical keyboard", "price": 70, "image_url": "https://placehold.co/600x600/1f2937/e5e7eb/png?text=Keyboard", "location": "Berkeley, CA"},
        {"source": "mercari", "source_item_id": "fallback-elec-6", "url": "https://www.mercari.com/search/?keyword=smartwatch", "title": "GPS smartwatch", "price": 120, "image_url": "https://placehold.co/600x600/0b1120/e2e8f0/png?text=Smartwatch", "location": "Palo Alto, CA"},
    ],
    "Furniture": [
        {"source": "craigslist", "source_item_id": "fallback-furn-1", "url": "https://sfbay.craigslist.org/search/sss?query=sectional+sofa", "title": "Modern sectional sofa", "price": 280, "image_url": "https://placehold.co/600x600/1f2937/e5e7eb/png?text=Sectional+Sofa", "location": "San Francisco, CA"},
        {"source": "offerup", "source_item_id": "fallback-furn-2", "url": "https://offerup.com/search/?q=office+chair", "title": "Ergonomic office chair", "price": 95, "image_url": "https://placehold.co/600x600/0f172a/e2e8f0/png?text=Office+Chair", "location": "San Mateo, CA"},
        {"source": "goodwill", "source_item_id": "fallback-furn-3", "url": "https://shopgoodwill.com/categories/listing?st=bookshelf", "title": "Solid wood bookshelf", "price": 88, "image_url": "https://placehold.co/600x600/172554/e2e8f0/png?text=Bookshelf", "location": "Online"},
        {"source": "mercari", "source_item_id": "fallback-furn-4", "url": "https://www.mercari.com/search/?keyword=coffee%20table", "title": "Mid-century coffee table", "price": 135, "image_url": "https://placehold.co/600x600/111827/e5e7eb/png?text=Coffee+Table", "location": "San Bruno, CA"},
        {"source": "offerup", "source_item_id": "fallback-furn-5", "url": "https://offerup.com/search/?q=table+lamp", "title": "Ceramic table lamp pair", "price": 62, "image_url": "https://placehold.co/600x600/1e293b/e2e8f0/png?text=Table+Lamp", "location": "Redwood City, CA"},
        {"source": "mercari", "source_item_id": "fallback-furn-6", "url": "https://www.mercari.com/search/?keyword=dresser", "title": "Six-drawer wood dresser", "price": 210, "image_url": "https://placehold.co/600x600/0b1120/e2e8f0/png?text=Dresser", "location": "San Jose, CA"},
    ],
    "Sports": [
        {"source": "craigslist", "source_item_id": "fallback-sport-1", "url": "https://sfbay.craigslist.org/search/sss?query=road+bike", "title": "Carbon road bike", "price": 540, "image_url": "https://placehold.co/600x600/111827/e5e7eb/png?text=Road+Bike", "location": "San Francisco, CA"},
        {"source": "offerup", "source_item_id": "fallback-sport-2", "url": "https://offerup.com/search/?q=dumbbells", "title": "Adjustable dumbbell set", "price": 160, "image_url": "https://placehold.co/600x600/0f172a/e2e8f0/png?text=Dumbbells", "location": "Daly City, CA"},
        {"source": "mercari", "source_item_id": "fallback-sport-3", "url": "https://www.mercari.com/search/?keyword=golf%20clubs", "title": "Complete golf club set", "price": 225, "image_url": "https://placehold.co/600x600/172554/e2e8f0/png?text=Golf+Clubs", "location": "Oakland, CA"},
        {"source": "goodwill", "source_item_id": "fallback-sport-4", "url": "https://shopgoodwill.com/categories/listing?st=tennis%20racket", "title": "Tennis racket bundle", "price": 48, "image_url": "https://placehold.co/600x600/1e293b/e2e8f0/png?text=Tennis+Racket", "location": "Online"},
        {"source": "goodwill", "source_item_id": "fallback-sport-5", "url": "https://shopgoodwill.com/categories/listing?st=skateboard", "title": "Street skateboard complete", "price": 72, "image_url": "https://placehold.co/600x600/1f2937/e5e7eb/png?text=Skateboard", "location": "Berkeley, CA"},
        {"source": "mercari", "source_item_id": "fallback-sport-6", "url": "https://www.mercari.com/search/?keyword=fitness%20watch", "title": "Fitness watch", "price": 110, "image_url": "https://placehold.co/600x600/0b1120/e2e8f0/png?text=Fitness+Watch", "location": "San Jose, CA"},
    ],
}


# ── Intent parsing ───────────────────────────────────────────────

async def parse_intent(message: str) -> SearchConstraints:
    """
    Use DigitalOcean Gradient LLM to extract structured search constraints.
    Falls back to heuristic parser when no API key is configured.
    """
    if not DO_INFERENCE_API_KEY:
        return _heuristic_parse(message)

    prompt = (
        "Extract shopping search constraints from the user query.\n"
        "Return valid JSON only — no extra text.\n"
        'Schema: {"item": str, "max_price": number|null, '
        '"condition": "new"|"like_new"|"good"|"fair"|"poor"|null, '
        '"zip_code": str|null, "location": str|null, "keywords": [str]}\n\n'
        f"Query: {message}"
    )

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.post(
                f"{DO_INFERENCE_BASE_URL.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {DO_INFERENCE_API_KEY}"},
                json={
                    "model": MODEL_NAME,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0,
                    "max_tokens": 200,
                },
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()

        match = re.search(r"\{.*\}", content, re.DOTALL)
        if not match:
            return _heuristic_parse(message)

        data = json.loads(match.group())
        return SearchConstraints(
            item=data.get("item") or message,
            max_price=data.get("max_price"),
            condition=data.get("condition"),
            zip_code=str(data.get("zip_code") or "").strip() or None,
            location=data.get("location"),
            keywords=data.get("keywords", []),
        )
    except Exception:
        return _heuristic_parse(message)


def _heuristic_parse(message: str) -> SearchConstraints:
    """Simple regex-based fallback parser."""
    price_match = re.search(r"(?:under|below|max|budget|<)\s*\$?(\d+)", message, re.I)
    max_price = float(price_match.group(1)) if price_match else None

    zip_match = re.search(r"\b(\d{5})\b", message)
    zip_code = zip_match.group(1) if zip_match else None

    stop = {"find", "me", "looking", "for", "get", "buy", "cheap", "best",
            "deals", "deal", "under", "below", "near", "a", "an", "the"}
    words = [w.strip("$.,!?") for w in message.lower().split() if w.strip("$.,!?") not in stop and not w.replace("$", "").isdigit()]
    item = " ".join(words[:4]) if words else message

    return SearchConstraints(item=item, max_price=max_price, zip_code=zip_code)


# ── Deduplication ────────────────────────────────────────────────

def _deduplicate(listings: list[ListingCandidate]) -> list[ListingCandidate]:
    """Remove near-duplicate listings by title fingerprint + price bucket."""
    stop = {"the", "a", "an", "in", "for", "with", "and", "or", "used",
            "new", "like", "good", "fair", "poor", "great", "nice", "free"}
    seen: set[tuple] = set()
    unique = []
    for listing in listings:
        words = [
            w.lower().strip(".,!?-")
            for w in listing.title.split()
            if w.lower() not in stop and len(w) > 1
        ]
        fingerprint = frozenset(words[:6])
        bucket = round(listing.price / 10)
        key = (fingerprint, bucket)
        if key not in seen:
            seen.add(key)
            unique.append(listing)
    return unique


def _fallback_listings(category: str) -> list[ListingCandidate]:
    items = []
    for raw in DISCOVERY_FALLBACKS.get(category, []):
        items.append(
            ListingCandidate(
                source=str(raw["source"]),
                source_item_id=str(raw["source_item_id"]),
                url=str(raw["url"]),
                title=str(raw["title"]),
                price=float(raw["price"]),
                condition="good",
                image_urls=[str(raw["image_url"])],
                location_text=str(raw["location"]),
                is_local_pickup=True,
                is_shipped=True,
            )
        )
    return items


async def _safe_listing_search(coro, timeout: float = 8.0) -> list[ListingCandidate]:
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except Exception:
        return []


def _discovery_mix(category: str, listings: list[ListingCandidate], limit: int = 12) -> list[ListingCandidate]:
    deduped = _deduplicate([
        listing
        for listing in listings
        if listing.title and listing.price > 0
    ])

    source_buckets: dict[str, list[ListingCandidate]] = {}
    for listing in deduped:
        source_buckets.setdefault(listing.source, []).append(listing)

    for bucket in source_buckets.values():
        bucket.sort(key=lambda item: (0 if item.image_urls else 1, item.price))

    mixed: list[ListingCandidate] = []
    while len(mixed) < limit and any(source_buckets.values()):
        for source in list(source_buckets):
            bucket = source_buckets[source]
            if not bucket:
                continue
            mixed.append(bucket.pop(0))
            if len(mixed) >= limit:
                break

    if len(mixed) < limit:
        existing_ids = {listing.source_item_id for listing in mixed}
        for listing in _fallback_listings(category):
            if listing.source_item_id in existing_ids:
                continue
            mixed.append(listing)
            if len(mixed) >= limit:
                break

    if not mixed:
        mixed = _fallback_listings(category)[:limit]

    return mixed


async def _load_discovery_category(category: str, zip_code: str) -> list[ListingCandidate]:
    queries = DISCOVERY_CATEGORY_QUERIES.get(category, [category])
    primary_query = queries[0]
    secondary_query = queries[1] if len(queries) > 1 else primary_query
    tertiary_query = queries[2] if len(queries) > 2 else secondary_query

    results = await asyncio.gather(
        _safe_listing_search(search_mercari(primary_query, 0), timeout=8.0),
        _safe_listing_search(search_craigslist(secondary_query, 0, zip_code), timeout=8.0),
        _safe_listing_search(search_goodwill(tertiary_query, 0), timeout=8.0),
        _safe_listing_search(search_offerup(primary_query, 0), timeout=10.0),
        _safe_listing_search(search_facebook(secondary_query, 0), timeout=10.0),
        return_exceptions=False,
    )

    merged: list[ListingCandidate] = []
    for batch in results:
        merged.extend(batch[:8])

    return _discovery_mix(category, merged, limit=12)


# ── Scoring ──────────────────────────────────────────────────────

def _score_listing(
    listing: ListingCandidate,
    fair_low: float,
    fair_high: float,
    max_price: float,
) -> ListingCandidate:
    """Compute deal_score and fill all scoring fields on the listing in-place."""
    fair_mid = (fair_low + fair_high) / 2 if fair_high > 0 else 0.0

    # 1. Value gap (25%) — how far below fair/retail value
    if fair_mid > 0:
        gap = (fair_mid - listing.price) / fair_mid
        value_gap_score = int(min(100, max(0, 50 + gap * 100)))
        listing.value_gap_pct = round(gap, 4)
    else:
        value_gap_score = 50
        listing.value_gap_pct = 0.0

    # 2. Price vs budget (25%)
    if max_price > 0:
        ratio = listing.price / max_price
        if ratio <= 0.5:
            price_score = 100
        elif ratio <= 0.8:
            price_score = 80
        elif ratio <= 1.0:
            price_score = 60
        else:
            price_score = max(0, int(40 - (ratio - 1.0) * 100))
    else:
        price_score = 50

    # 3. Condition (25%)
    condition_score = _CONDITION_SCORE.get(listing.condition, 50)

    # 4. Seller reputation (15%)
    seller_score = int(min(100, listing.seller_rating * 20)) if listing.seller_rating > 0 else 60

    # 5. Freshness (10%)
    freshness_score = 75

    overall = int(
        value_gap_score  * 0.25
        + price_score    * 0.25
        + condition_score * 0.25
        + seller_score   * 0.15
        + freshness_score * 0.10
    )

    # Recommended offer (round to nearest $5)
    raw_offer = (
        min(listing.price * 0.9, fair_mid * 0.75) if fair_mid > 0
        else listing.price * 0.85
    )
    recommended_offer = round(raw_offer / 5) * 5

    listing.deal_score = overall
    listing.fair_value_low = round(fair_low, 2)
    listing.fair_value_high = round(fair_high, 2)
    listing.recommended_offer = recommended_offer
    return listing


# ── FastAPI App ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("ReFind Agent Backend starting...")
    yield
    print("ReFind Agent Backend shutting down.")


app = FastAPI(title="ReFind Agent API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "refind-agent", "llm": bool(DO_INFERENCE_API_KEY)}


# ── /api/trending — Discovery Screen ────────────────────────────

@app.get("/api/trending")
async def trending(zip: str = "10001"):
    """Parallel category searches across available sources for the Discovery Screen."""
    response: dict[str, list] = {}

    try:
        categories = list(DISCOVERY_CATEGORY_QUERIES)
        results = await asyncio.gather(
            *[_load_discovery_category(category, zip) for category in categories],
            return_exceptions=True,
        )

        for category, result in zip(categories, results):
            if isinstance(result, Exception):
                response[category] = [listing.model_dump() for listing in _fallback_listings(category)]
            else:
                response[category] = [listing.model_dump() for listing in result]
    except Exception:
        for category in DISCOVERY_CATEGORY_QUERIES:
            response[category] = [listing.model_dump() for listing in _fallback_listings(category)]

    return response


# ── /api/agent/chat — Full parallel pipeline ─────────────────────

@app.post("/api/agent/chat")
async def agent_chat(request: ChatRequest):
    """
    Pipeline:
      parse_intent → fan-out adapters (parallel) → dedupe → score → policy gate → SSE stream
    """

    async def event_generator():
        def _sse(data: dict) -> dict:
            return {"event": "message", "data": json.dumps(data)}

        try:
            # ── 1. Parse intent ──────────────────────────────────
            constraints = await parse_intent(request.message)

            # ── 2. Define all adapters ───────────────────────────
            adapters: list[tuple[str, str, object, list]] = [
                ("adapter-mercari",    "search_mercari",    search_mercari,    [constraints.item, constraints.max_price or 0]),
                ("adapter-craigslist", "search_craigslist", search_craigslist, [constraints.item, constraints.max_price or 0, constraints.zip_code or ""]),
                ("adapter-goodwill",   "search_goodwill",   search_goodwill,   [constraints.item, constraints.max_price or 0]),
                ("adapter-offerup",    "search_offerup",    search_offerup,    [constraints.item, constraints.max_price or 0]),
                ("adapter-facebook",   "search_facebook",   search_facebook,   [constraints.item, constraints.max_price or 0]),
            ]

            # Emit a tool_call for every adapter right away (they run in parallel)
            for tc_id, tool_name, _, _ in adapters:
                yield _sse({
                    "type": "tool_call",
                    "tool_call_id": tc_id,
                    "tool_name": tool_name,
                    "args": {
                        "query": constraints.item,
                        "max_price": constraints.max_price,
                        "zip_code": constraints.zip_code,
                    },
                })

            # ── 3. Run all adapters in parallel, yield results as they arrive ──
            result_queue: asyncio.Queue = asyncio.Queue()

            async def _run(tc_id: str, fn, args: list):
                try:
                    listings = await fn(*args)
                    await result_queue.put((tc_id, listings, None))
                except Exception as exc:
                    await result_queue.put((tc_id, [], str(exc)))

            tasks = [
                asyncio.create_task(_run(tc_id, fn, args))
                for tc_id, _, fn, args in adapters
            ]

            all_listings: list[ListingCandidate] = []
            for _ in range(len(adapters)):
                tc_id, listings, error = await result_queue.get()
                all_listings.extend(listings)
                yield _sse({
                    "type": "tool_result",
                    "tool_call_id": tc_id,
                    "result": {"count": len(listings), "status": "error" if error else "complete"},
                })

            await asyncio.gather(*tasks, return_exceptions=True)

            # ── 4. Score & rank ──────────────────────────────────
            yield _sse({"type": "tool_call", "tool_call_id": "score", "tool_name": "score_deal", "args": {}})

            all_listings = _deduplicate(all_listings)
            fair_low, fair_high = await get_fair_value(constraints.item)

            scored = [
                _score_listing(l, fair_low, fair_high, constraints.max_price or 0)
                for l in all_listings
            ]
            scored.sort(key=lambda l: -l.deal_score)

            # Policy gate — respect budget with 5% buffer
            if constraints.max_price:
                scored = [l for l in scored if l.price <= constraints.max_price * 1.05]

            top = scored[:5]

            yield _sse({
                "type": "tool_result",
                "tool_call_id": "score",
                "result": {"count": len(top), "status": "complete"},
            })

            # ── 5. Emit each top deal as a shortlist_result card ──
            for i, listing in enumerate(top):
                tc_id = f"deal-{i}"
                yield _sse({
                    "type": "tool_call",
                    "tool_call_id": tc_id,
                    "tool_name": "shortlist_result",
                    "args": {"listing": listing.model_dump()},
                })
                yield _sse({"type": "tool_result", "tool_call_id": tc_id, "result": {}})

            # ── 6. Text summary ──────────────────────────────────
            sources_used = sorted({l.source for l in all_listings})
            if top:
                summary = (
                    f"Found **{len(all_listings)} listings** across "
                    f"{len(sources_used)} source{'s' if len(sources_used) != 1 else ''} "
                    f"({', '.join(sources_used)}). "
                    f"Here are the top {len(top)} deals scored for you."
                )
                if fair_high > 0:
                    summary += f"\n\n_Retail reference: ${fair_low:.0f}–${fair_high:.0f}_"
            else:
                summary = (
                    f"No listings found for **\"{constraints.item}\"**. "
                    "Try broadening your search or adjusting your budget."
                )

            for i in range(0, len(summary), 8):
                yield _sse({"type": "text", "content": summary[i : i + 8]})
                await asyncio.sleep(0.015)

            yield _sse({"type": "done"})
            yield {"event": "message", "data": "[DONE]"}

        except Exception as exc:
            yield _sse({"type": "text", "content": f"Pipeline error: {exc}"})
            yield _sse({"type": "done"})
            yield {"event": "message", "data": "[DONE]"}

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)

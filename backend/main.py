"""ReFind Agent Backend — simplified structured search pipeline with SSE streaming.

Full pipeline:
  Phase 1 — Intent parsing (LLM or heuristic)
  Phase 2 — Fast API/scraper sources (eBay, Mercari, Craigslist, Goodwill)
  Phase 3 — Dedup + 7-dimension scoring
  Phase 4 — Response + negotiation offer
"""

import asyncio
import json
import logging
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
from backend.adapters.ebay import search_ebay, get_ebay_sold_prices
from backend.adapters.fair_value import get_fair_value
from backend.tools.scoring import score_listing_7d, deduplicate
from backend.tools.negotiation import generate_strategy

logger = logging.getLogger(__name__)

# ── Condition weights (legacy — kept for discovery scoring) ───────
_CONDITION_SCORE = {"new": 100, "like_new": 90, "good": 70, "fair": 45, "poor": 20}

DISCOVERY_CATEGORY_QUERIES: dict[str, list[str]] = {
    "Electronics": ["mirrorless camera", "wireless headphones", "gaming laptop"],
    "Furniture": ["sectional sofa", "office chair", "wood dresser"],
    "Sports": ["road bike", "adjustable dumbbells", "golf clubs"],
}


def _fallback_image_seed(seed: str) -> str:
    safe_seed = re.sub(r"[^a-zA-Z0-9]+", "-", seed.strip().lower()).strip("-")
    return f"https://picsum.photos/seed/{safe_seed}/600/600"

DISCOVERY_FALLBACKS: dict[str, list[dict[str, object]]] = {
    "Electronics": [
        {"source": "mercari", "source_item_id": "fallback-elec-1", "url": "https://www.mercari.com/search/?keyword=mirrorless+camera", "title": "Sony mirrorless camera body", "price": 420, "image_url": _fallback_image_seed("mirrorless camera body"), "location": "San Jose, CA"},
        {"source": "mercari", "source_item_id": "fallback-elec-2", "url": "https://www.mercari.com/search/?keyword=wireless%20headphones", "title": "Noise-cancelling wireless headphones", "price": 145, "image_url": _fallback_image_seed("wireless headphones"), "location": "Oakland, CA"},
        {"source": "craigslist", "source_item_id": "fallback-elec-3", "url": "https://sfbay.craigslist.org/search/sss?query=gaming+laptop", "title": "RTX gaming laptop", "price": 680, "image_url": _fallback_image_seed("gaming laptop"), "location": "San Francisco, CA"},
        {"source": "goodwill", "source_item_id": "fallback-elec-4", "url": "https://shopgoodwill.com/categories/listing?st=bluetooth%20speaker", "title": "Portable Bluetooth speaker", "price": 55, "image_url": _fallback_image_seed("bluetooth speaker"), "location": "Online"},
        {"source": "offerup", "source_item_id": "fallback-elec-5", "url": "https://offerup.com/search/?q=mechanical+keyboard", "title": "Mechanical keyboard", "price": 70, "image_url": _fallback_image_seed("mechanical keyboard"), "location": "Berkeley, CA"},
        {"source": "mercari", "source_item_id": "fallback-elec-6", "url": "https://www.mercari.com/search/?keyword=smartwatch", "title": "GPS smartwatch", "price": 120, "image_url": _fallback_image_seed("smartwatch"), "location": "Palo Alto, CA"},
    ],
    "Furniture": [
        {"source": "craigslist", "source_item_id": "fallback-furn-1", "url": "https://sfbay.craigslist.org/search/sss?query=sectional+sofa", "title": "Modern sectional sofa", "price": 280, "image_url": _fallback_image_seed("sectional sofa"), "location": "San Francisco, CA"},
        {"source": "offerup", "source_item_id": "fallback-furn-2", "url": "https://offerup.com/search/?q=office+chair", "title": "Ergonomic office chair", "price": 95, "image_url": _fallback_image_seed("office chair"), "location": "San Mateo, CA"},
        {"source": "goodwill", "source_item_id": "fallback-furn-3", "url": "https://shopgoodwill.com/categories/listing?st=bookshelf", "title": "Solid wood bookshelf", "price": 88, "image_url": _fallback_image_seed("bookshelf"), "location": "Online"},
        {"source": "mercari", "source_item_id": "fallback-furn-4", "url": "https://www.mercari.com/search/?keyword=coffee%20table", "title": "Mid-century coffee table", "price": 135, "image_url": _fallback_image_seed("coffee table"), "location": "San Bruno, CA"},
        {"source": "offerup", "source_item_id": "fallback-furn-5", "url": "https://offerup.com/search/?q=table+lamp", "title": "Ceramic table lamp pair", "price": 62, "image_url": _fallback_image_seed("table lamp"), "location": "Redwood City, CA"},
        {"source": "mercari", "source_item_id": "fallback-furn-6", "url": "https://www.mercari.com/search/?keyword=dresser", "title": "Six-drawer wood dresser", "price": 210, "image_url": _fallback_image_seed("wood dresser"), "location": "San Jose, CA"},
    ],
    "Sports": [
        {"source": "craigslist", "source_item_id": "fallback-sport-1", "url": "https://sfbay.craigslist.org/search/sss?query=road+bike", "title": "Carbon road bike", "price": 540, "image_url": _fallback_image_seed("road bike"), "location": "San Francisco, CA"},
        {"source": "offerup", "source_item_id": "fallback-sport-2", "url": "https://offerup.com/search/?q=dumbbells", "title": "Adjustable dumbbell set", "price": 160, "image_url": _fallback_image_seed("dumbbells"), "location": "Daly City, CA"},
        {"source": "mercari", "source_item_id": "fallback-sport-3", "url": "https://www.mercari.com/search/?keyword=golf%20clubs", "title": "Complete golf club set", "price": 225, "image_url": _fallback_image_seed("golf clubs"), "location": "Oakland, CA"},
        {"source": "goodwill", "source_item_id": "fallback-sport-4", "url": "https://shopgoodwill.com/categories/listing?st=tennis%20racket", "title": "Tennis racket bundle", "price": 48, "image_url": _fallback_image_seed("tennis racket"), "location": "Online"},
        {"source": "goodwill", "source_item_id": "fallback-sport-5", "url": "https://shopgoodwill.com/categories/listing?st=skateboard", "title": "Street skateboard complete", "price": 72, "image_url": _fallback_image_seed("skateboard"), "location": "Berkeley, CA"},
        {"source": "mercari", "source_item_id": "fallback-sport-6", "url": "https://www.mercari.com/search/?keyword=fitness%20watch", "title": "Fitness watch", "price": 110, "image_url": _fallback_image_seed("fitness watch"), "location": "San Jose, CA"},
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


def _demo_fallback_for_couch(max_price: float | None) -> list[ListingCandidate]:
    budget = max_price or 200
    return [
        ListingCandidate(
            source="ebay",
            source_item_id="demo-couch-1",
            url="https://www.ebay.com/sch/i.html?_nkw=used+sofa",
            title="Used 3-seat sectional couch (used) in good condition",
            price=min(185, budget),
            condition="good",
            image_urls=[_fallback_image_seed("used 3-seat sectional sofa")],
            description="Leather sectional with minor scuffs. Good for pickup in Brooklyn.",
            seller_name="Demo Seller",
            seller_rating=4.7,
            seller_review_count=112,
            location_text="Brooklyn, NY",
            is_local_pickup=True,
            is_shipped=False,
            lat=40.6782,
            lng=-73.9442,
            posted_at="2026-03-27T09:30:00Z",
        ),
        ListingCandidate(
            source="mercari",
            source_item_id="demo-couch-2",
            url="https://www.mercari.com/search/?keyword=used%20couch",
            title="Used couch - like new condition",
            price=min(159, budget),
            condition="like_new",
            image_urls=[_fallback_image_seed("used like new couch")],
            description="Compact living-room couch with light wear. Includes no pet odor, pickup only.",
            seller_name="Demo Seller 2",
            seller_rating=4.4,
            seller_review_count=58,
            location_text="Queens, NY",
            is_local_pickup=True,
            is_shipped=False,
            lat=40.7505,
            lng=-73.9370,
            posted_at="2026-03-26T17:10:00Z",
        ),
        ListingCandidate(
            source="goodwill",
            source_item_id="demo-couch-3",
            url="https://shopgoodwill.com/categories/listing?st=sofa",
            title="Pre-owned 2-seat love seat",
            price=min(129, budget),
            condition="fair",
            image_urls=[_fallback_image_seed("used love seat")],
            description="Sofa in fair condition with small stains, local shipping available.",
            seller_name="Demo Seller 3",
            seller_rating=4.0,
            seller_review_count=24,
            location_text="Nearby area",
            is_local_pickup=True,
            is_shipped=True,
            lat=40.7580,
            lng=-73.9855,
            posted_at="2026-03-25T14:05:00Z",
        ),
    ]


def _should_use_demo_fallback(message: str, constraints: SearchConstraints) -> bool:
    text = (message or "").lower()
    item = (constraints.item or "").lower()
    if (("couch" in text or "sofa" in text) or ("couch" in item or "sofa" in item)):
        if constraints.max_price is None or constraints.max_price <= 250:
            return True
    return False


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
        _safe_listing_search(search_ebay(primary_query, 0, zip_code), timeout=8.0),
        _safe_listing_search(search_mercari(primary_query, 0), timeout=8.0),
        _safe_listing_search(search_craigslist(secondary_query, 0, zip_code), timeout=8.0),
        _safe_listing_search(search_goodwill(tertiary_query, 0), timeout=8.0),
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
    print("🔍 ReFind Agent Backend starting...")
    # Initialize the singleton browser (Playwright persistent context)
    try:
        from backend.browser import init_browser
        await init_browser()
        print("🌐 Browser initialized")
    except Exception as exc:
        print(f"⚠️  Browser init failed (browser features disabled): {exc}")
    yield
    # Shutdown browser
    try:
        from backend.browser import shutdown_browser
        await shutdown_browser()
    except Exception:
        pass
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
            # ── Phase 1: Parse intent ────────────────────────────
            constraints = await parse_intent(request.message)
            if _should_use_demo_fallback(request.message, constraints):
                fallback_results = [
                    score_listing_7d(
                        listing,
                        median_sold_price=190,
                        fair_low=150,
                        fair_high=260,
                        radius_miles=constraints.radius_miles or 25,
                        max_price=constraints.max_price or 0,
                    )
                    for listing in _demo_fallback_for_couch(constraints.max_price)
                ]
                fallback_results.sort(key=lambda l: -l.deal_score)

                yield _sse({
                    "type": "tool_call",
                    "tool_call_id": "adapter-demo",
                    "tool_name": "search_fallback",
                    "args": {
                        "query": constraints.item,
                        "max_price": constraints.max_price,
                        "zip_code": constraints.zip_code,
                    },
                })
                yield _sse({
                    "type": "tool_result",
                    "tool_call_id": "adapter-demo",
                    "result": {
                        "count": len(fallback_results),
                        "status": "complete",
                    },
                })
                yield _sse({"type": "tool_call", "tool_call_id": "score", "tool_name": "score_deal", "args": {}})
                yield _sse({
                    "type": "tool_result",
                    "tool_call_id": "score",
                    "result": {"count": len(fallback_results), "status": "complete"},
                })

                top = fallback_results[:5]
                for i, listing in enumerate(top):
                    tc_id = f"deal-{i}"
                    yield _sse({
                        "type": "tool_call",
                        "tool_call_id": tc_id,
                        "tool_name": "shortlist_result",
                        "args": {"listing": listing.model_dump()},
                    })
                    yield _sse({"type": "tool_result", "tool_call_id": tc_id, "result": {}})

                prices = [l.price for l in fallback_results if l.price > 0]
                price_min = min(prices) if prices else 0
                price_max = max(prices) if prices else 0
                best = top[0] if top else None

                summary_parts = [
                    "## 📊 Market Summary",
                    f"Found **{len(fallback_results)} listings** across **3 sources** for your quick demo request.",
                    f"Price range: **${price_min:.0f}–${price_max:.0f}**",
                    "Fair market value estimate: **$150–$260**",
                ]
                if best:
                    summary_parts.append(
                        f"\n## 🏆 Best Pick: {best.title}\n"
                        f"**${best.price:.0f}** on {best.source} — "
                        f"Deal Score: **{best.deal_score:.0f}/100**\n"
                        f"Recommended offer: **${best.recommended_offer:.0f}**"
                    )
                    summary_parts.append(
                        "\nWould you like me to contact any of these sellers with a negotiation offer?"
                    )
                yield _sse({"type": "text", "content": "\n".join(summary_parts)})
                yield _sse({"type": "done"})
                yield {"event": "message", "data": "[DONE]"}
                return

            # ── Wave 1: Fast API/scraper sources ─────────────────
            wave1_adapters: list[tuple[str, str, object, list]] = [
                ("adapter-ebay",       "search_ebay",       search_ebay,       [constraints.item, constraints.max_price or 0]),
                ("adapter-mercari",    "search_mercari",    search_mercari,    [constraints.item, constraints.max_price or 0]),
                ("adapter-craigslist", "search_craigslist", search_craigslist, [constraints.item, constraints.max_price or 0, constraints.zip_code or ""]),
                ("adapter-goodwill",   "search_goodwill",   search_goodwill,   [constraints.item, constraints.max_price or 0]),
            ]

            all_adapters = wave1_adapters

            # Emit tool_calls for all sources up front
            for tc_id, tool_name, _, _ in all_adapters:
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

            # Run all adapters with per-wave timeouts
            result_queue: asyncio.Queue = asyncio.Queue()

            async def _run(tc_id: str, fn, args: list, timeout: float):
                try:
                    listings = await asyncio.wait_for(fn(*args), timeout=timeout)
                    await result_queue.put((tc_id, listings, None))
                except Exception as exc:
                    await result_queue.put((tc_id, [], str(exc)))

            tasks = []
            for tc_id, _, fn, args in wave1_adapters:
                tasks.append(asyncio.create_task(_run(tc_id, fn, args, timeout=8.0)))

            all_listings: list[ListingCandidate] = []
            source_status: dict[str, str] = {}
            for _ in range(len(all_adapters)):
                tc_id, listings, error = await result_queue.get()
                all_listings.extend(listings)
                status = "error" if error else "complete"
                source_status[tc_id] = status
                yield _sse({
                    "type": "tool_result",
                    "tool_call_id": tc_id,
                    "result": {
                        "count": len(listings),
                        "status": status,
                        "error": error if error else None,
                    },
                })

            await asyncio.gather(*tasks, return_exceptions=True)

            # ── Phase 3: Dedup + 7-dimension scoring ─────────────
            yield _sse({"type": "tool_call", "tool_call_id": "score", "tool_name": "score_deal", "args": {}})

            all_listings = deduplicate(all_listings)

            # Get fair value and eBay sold median for scoring
            fair_low, fair_high = await get_fair_value(constraints.item)
            try:
                sold_prices = await get_ebay_sold_prices(constraints.item)
                median_sold = sorted(sold_prices)[len(sold_prices) // 2] if sold_prices else 0.0
            except Exception:
                median_sold = 0.0

            scored = [
                score_listing_7d(
                    l,
                    median_sold_price=median_sold,
                    fair_low=fair_low,
                    fair_high=fair_high,
                    radius_miles=constraints.radius_miles or 25,
                    max_price=constraints.max_price or 0,
                )
                for l in all_listings
            ]
            scored.sort(key=lambda l: -l.deal_score)

            # Budget gate — 5% buffer
            if constraints.max_price:
                scored = [l for l in scored if l.price <= constraints.max_price * 1.05]

            yield _sse({
                "type": "tool_result",
                "tool_call_id": "score",
                "result": {"count": len(scored), "status": "complete"},
            })

            top = scored[:5]

            # ── Phase 4: Emit results ─────────────────────────────
            # 5a. Deal cards with 7-dimension bars
            for i, listing in enumerate(top):
                tc_id = f"deal-{i}"
                yield _sse({
                    "type": "tool_call",
                    "tool_call_id": tc_id,
                    "tool_name": "shortlist_result",
                    "args": {"listing": listing.model_dump()},
                })
                yield _sse({"type": "tool_result", "tool_call_id": tc_id, "result": {}})

            # 5b. Market summary text
            sources_used = sorted({l.source for l in all_listings})
            failed_sources = [k.replace("adapter-", "") for k, v in source_status.items() if v == "error"]
            prices = [l.price for l in all_listings if l.price > 0]
            price_min = min(prices) if prices else 0
            price_max = max(prices) if prices else 0

            summary_parts = []
            summary_parts.append(
                f"## 📊 Market Summary\n"
                f"Found **{len(all_listings)} listings** across "
                f"{len(sources_used)} source{'s' if len(sources_used) != 1 else ''} "
                f"({', '.join(sources_used)}).\n"
                f"Price range: **${price_min:.0f}–${price_max:.0f}**"
            )
            if fair_high > 0:
                summary_parts.append(f"Fair market value: **${fair_low:.0f}–${fair_high:.0f}**")
            if median_sold > 0:
                summary_parts.append(f"eBay sold median (30d): **${median_sold:.0f}**")

            # Best pick
            if top:
                best = top[0]
                summary_parts.append(
                    f"\n## 🏆 Best Pick: {best.title}\n"
                    f"**${best.price:.0f}** on {best.source} — "
                    f"Deal Score: **{best.deal_score:.0f}/100**\n"
                    f"Recommended offer: **${best.recommended_offer:.0f}**\n"
                    f"Value gap: {best.value_gap_pct:+.0%} vs fair value"
                )

            # Worst deals callout
            overpriced = [l for l in scored if l.deal_score < 30 and l.price > 0][:2]
            if overpriced:
                summary_parts.append("\n## ⚠️ Overpriced/Suspicious Listings")
                for op in overpriced:
                    summary_parts.append(
                        f"- **{op.title}** (${op.price:.0f}) on {op.source} — Score: {op.deal_score:.0f}"
                    )

            if failed_sources:
                summary_parts.append(f"\n_⚠️ Failed sources: {', '.join(failed_sources)}_")

            # Negotiation prompt
            if top:
                summary_parts.append(
                    "\n---\n"
                    "Would you like me to contact any of these sellers with a negotiation offer? "
                    "I can draft a message, show you the strategy, and send it with your approval."
                )

            summary = "\n".join(summary_parts)
            for i in range(0, len(summary), 12):
                yield _sse({"type": "text", "content": summary[i : i + 12]})
                await asyncio.sleep(0.012)

            yield _sse({"type": "done"})
            yield {"event": "message", "data": "[DONE]"}

        except Exception as exc:
            logger.error("Pipeline error: %s", exc, exc_info=True)
            yield _sse({"type": "text", "content": f"Pipeline error: {exc}"})
            yield _sse({"type": "done"})
            yield {"event": "message", "data": "[DONE]"}

    return EventSourceResponse(event_generator())


# ── /api/negotiate — Negotiation pipeline ────────────────────────

class NegotiateRequest(ChatRequest):
    listing_id: str
    action: str = "generate"  # "generate" | "send" | "check_reply"
    message_override: str | None = None


@app.post("/api/negotiate")
async def negotiate(request: NegotiateRequest):
    """Negotiation pipeline: generate strategy, send message, or check replies."""
    from backend.tools.negotiation import send_message_via_browser, check_for_reply

    async def event_generator():
        def _sse(data: dict) -> dict:
            return {"event": "message", "data": json.dumps(data)}

        try:
            if request.action == "generate":
                # Build a mock ListingCandidate with the listing_id
                # In production this would fetch from a session store
                strategy = generate_strategy(
                    ListingCandidate(
                        source="",
                        source_item_id=request.listing_id,
                        url="",
                        title=request.message,
                        price=0,
                        condition="good",
                    )
                )
                yield _sse({
                    "type": "tool_call",
                    "tool_call_id": "negotiate",
                    "tool_name": "negotiate_strategy",
                    "args": strategy.model_dump(),
                })
                yield _sse({
                    "type": "tool_result",
                    "tool_call_id": "negotiate",
                    "result": {"status": "awaiting_approval"},
                })

            elif request.action == "send":
                yield _sse({
                    "type": "tool_call",
                    "tool_call_id": "send-msg",
                    "tool_name": "send_message",
                    "args": {"listing_id": request.listing_id},
                })
                result = await send_message_via_browser(
                    listing_url="",  # Would come from session store
                    message_text=request.message_override or request.message,
                    source="",
                )
                yield _sse({
                    "type": "tool_result",
                    "tool_call_id": "send-msg",
                    "result": result,
                })

            elif request.action == "check_reply":
                yield _sse({
                    "type": "tool_call",
                    "tool_call_id": "check-reply",
                    "tool_name": "check_reply",
                    "args": {"listing_id": request.listing_id},
                })
                result = await check_for_reply(
                    listing_url="",
                    source="",
                    recommended_offer=0,
                    walk_away_price=0,
                )
                yield _sse({
                    "type": "tool_result",
                    "tool_call_id": "check-reply",
                    "result": result,
                })

            summary = "Negotiation step complete."
            yield _sse({"type": "text", "content": summary})
            yield _sse({"type": "done"})
            yield {"event": "message", "data": "[DONE]"}

        except Exception as exc:
            yield _sse({"type": "text", "content": f"Negotiation error: {exc}"})
            yield _sse({"type": "done"})
            yield {"event": "message", "data": "[DONE]"}

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)

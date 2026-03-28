"""Fair value estimation — SerpAPI Google Shopping."""

import httpx
from backend.config import SERPAPI_KEY


async def get_retail_price(query: str) -> tuple[float, float]:
    """
    Return (low, high) retail price range from Google Shopping via SerpAPI.
    Falls back to (0, 0) if SerpAPI key is not set or call fails.
    """
    if not SERPAPI_KEY:
        return 0.0, 0.0

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google_shopping",
                    "q": query,
                    "api_key": SERPAPI_KEY,
                    "num": 10,
                },
            )
            if resp.status_code != 200:
                return 0.0, 0.0
            data = resp.json()
    except Exception:
        return 0.0, 0.0

    prices: list[float] = []
    for result in data.get("shopping_results", [])[:15]:
        raw = str(result.get("price", "")).replace("$", "").replace(",", "").strip()
        # Handle ranges like "199.99 - 249.99"
        parts = raw.split("-")
        for part in parts:
            try:
                prices.append(float(part.strip()))
            except ValueError:
                pass

    if not prices:
        return 0.0, 0.0

    prices.sort()
    # Use 20th–80th percentile to avoid outliers
    lo_idx = max(0, len(prices) // 5)
    hi_idx = min(len(prices) - 1, (len(prices) * 4) // 5)
    return round(prices[lo_idx], 2), round(prices[hi_idx], 2)


async def get_fair_value(query: str) -> tuple[float, float]:
    """
    Best-effort fair value: try SerpAPI Google Shopping.
    Returns (low, high). Both 0.0 means no data available.
    """
    low, high = await get_retail_price(query)
    if low > 0:
        return low, high

    return 0.0, 0.0

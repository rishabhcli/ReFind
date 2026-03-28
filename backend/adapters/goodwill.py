"""GoodwillFinds adapter — shopgoodwill.com public JSON search endpoint."""

import httpx
from backend.models.schemas import ListingCandidate

GOODWILL_API = "https://buyerapi.shopgoodwill.com/api/Search/ItemListing"


async def search_goodwill(query: str, max_price: float = 0) -> list[ListingCandidate]:
    """Search ShopGoodwill for thrift store auction listings."""
    body = {
        "searchText": query,
        "categoryId": 0,
        "minPrice": 0,
        "maxPrice": int(max_price) if max_price > 0 else 9999,
        "conditionId": 0,
        "quantity": 0,
        "isBuyNow": False,
        "startIndex": 0,
        "pageSize": 20,
        "sortColumn": "startTime",
        "sortDescending": True,
        "isSize": False,
        "isShipping": False,
    }

    async with httpx.AsyncClient(timeout=12) as client:
        resp = await client.post(
            GOODWILL_API,
            json=body,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://shopgoodwill.com",
                "Referer": "https://shopgoodwill.com/",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    # Response shape: {"searchResults": {"items": [...], "totalResults": N}}
    items = data.get("searchResults", {}).get("items", [])
    if not items:
        # Alternative shape used by some responses
        items = data.get("items", [])

    results = []
    for item in items[:20]:
        try:
            # Price can be currentPrice (auction) or buyNowPrice
            price = float(item.get("currentPrice") or item.get("minPrice") or 0)
            if price <= 0:
                continue

            title = item.get("title") or item.get("name") or ""
            if not title:
                continue

            item_id = str(item.get("itemId") or item.get("id") or "")
            image_url = item.get("imageUrl") or item.get("image") or ""
            seller = item.get("sellerName") or item.get("seller") or "Goodwill"

            results.append(ListingCandidate(
                source="goodwill",
                source_item_id=item_id,
                url=f"https://shopgoodwill.com/item/{item_id}",
                title=title,
                price=price,
                condition="good",   # Goodwill items are generally good or better
                image_urls=[image_url] if image_url else [],
                description=item.get("description", ""),
                seller_name=seller,
                seller_rating=0.0,
                location_text="",
                posted_at=str(item.get("startTime", "")),
                is_local_pickup=False,
                is_shipped=True,
            ))
        except Exception:
            continue

    return results

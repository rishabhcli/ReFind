"""Mercari adapter — reverse-engineered REST API, no auth needed."""

import uuid
import httpx
from backend.models.schemas import ListingCandidate

MERCARI_SEARCH_URL = "https://api.mercari.jp/v2/entities:search"

# itemConditionId → canonical condition
_CONDITION_MAP = {
    1: "new",
    2: "like_new",
    3: "good",
    4: "fair",
    5: "poor",
    # string variants from some responses
    "ITEM_CONDITION_NEW": "new",
    "ITEM_CONDITION_LIKE_NEW": "like_new",
    "ITEM_CONDITION_GOOD": "good",
    "ITEM_CONDITION_FAIR": "fair",
    "ITEM_CONDITION_POOR": "poor",
}


async def search_mercari(query: str, max_price: float = 0) -> list[ListingCandidate]:
    """Search Mercari for active listings matching query."""
    search_condition: dict = {
        "keyword": query,
        "status": ["STATUS_ON_SALE"],
    }
    if max_price > 0:
        search_condition["priceMax"] = int(max_price)

    body = {
        "searchSessionId": str(uuid.uuid4()),
        "pageToken": "",
        "indexRouting": "INDEX_ROUTING_UNSPECIFIED",
        "searchCondition": search_condition,
        "defaultDatasets": ["DATASET_TYPE_MERCARI"],
        "serviceFrom": "mercari",
        "withItemBrand": True,
        "withItemSize": False,
    }

    async with httpx.AsyncClient(timeout=12) as client:
        resp = await client.post(
            MERCARI_SEARCH_URL,
            headers={
                "X-Platform": "web",
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("items", [])[:20]:
        try:
            price = float(item.get("price", 0))
            if price <= 0:
                continue

            # Condition can be int ID or string enum
            cond_raw = item.get("itemConditionId", 3)
            condition = _CONDITION_MAP.get(cond_raw, "good")

            # Images: try thumbnails first, then photos
            image_urls: list[str] = []
            if item.get("thumbnails"):
                image_urls = list(item["thumbnails"])[:3]
            elif item.get("photos"):
                image_urls = [p.get("imageUrl", "") for p in item["photos"][:3] if p.get("imageUrl")]

            item_id = item.get("id", "")
            seller = item.get("seller", {})
            # Mercari star rating is typically 0–5
            rating = float(seller.get("starRating", 0) or 0)

            results.append(ListingCandidate(
                source="mercari",
                source_item_id=item_id,
                url=f"https://www.mercari.com/us/item/{item_id}/",
                title=item.get("name", ""),
                price=price,
                condition=condition,
                image_urls=image_urls,
                description=item.get("description", ""),
                seller_name=seller.get("name", ""),
                seller_rating=rating,
                location_text="",
                posted_at=str(item.get("updated", "")),
                is_local_pickup=False,
                is_shipped=True,
            ))
        except Exception:
            continue

    return results

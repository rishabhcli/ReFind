"""Goodwill adapter using the live ShopGoodwill search payload."""

from __future__ import annotations

from datetime import datetime

import httpx

from backend.models.schemas import ListingCandidate

GOODWILL_API = "https://buyerapi.shopgoodwill.com/api/Search/ItemListing"


def _search_payload(query: str, max_price: float) -> dict[str, object]:
    now = datetime.now()
    closed_auction_date = f"{now.month}/{now.day}/{now.year}"
    return {
        "isSize": False,
        "isWeddingCatagory": "false",
        "isMultipleCategoryIds": False,
        "isFromHeaderMenuTab": False,
        "layout": "",
        "isFromHomePage": False,
        "searchText": query,
        "selectedGroup": "",
        "selectedCategoryIds": "",
        "selectedSellerIds": "",
        "lowPrice": "0",
        "highPrice": str(int(max_price)) if max_price > 0 else "999999",
        "searchBuyNowOnly": "",
        "searchPickupOnly": "false",
        "searchNoPickupOnly": "false",
        "searchOneCentShippingOnly": "false",
        "searchDescriptions": "false",
        "searchClosedAuctions": "false",
        "closedAuctionEndingDate": closed_auction_date,
        "closedAuctionDaysBack": "7",
        "searchCanadaShipping": "false",
        "searchInternationalShippingOnly": "false",
        "sortColumn": "1",
        "page": "1",
        "pageSize": "40",
        "sortDescending": "false",
        "savedSearchId": 0,
        "useBuyerPrefs": "true",
        "searchUSOnlyShipping": "false",
        "categoryLevelNo": "1",
        "partNumber": "",
        "catIds": "",
        "categoryLevel": 1,
        "categoryId": 0,
    }


async def search_goodwill(query: str, max_price: float = 0) -> list[ListingCandidate]:
    """Search ShopGoodwill for auction listings."""
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        resp = await client.post(
            GOODWILL_API,
            json=_search_payload(query, max_price),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Origin": "https://shopgoodwill.com",
                "Referer": "https://shopgoodwill.com/categories/listing",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("searchResults", {}).get("items", [])
    if not isinstance(items, list):
        return []

    results: list[ListingCandidate] = []
    for item in items[:20]:
        try:
            item_id = str(item.get("itemId") or "").strip()
            title = str(item.get("title") or "").strip()
            if not item_id or not title:
                continue

            price_candidates = [
                item.get("currentPrice"),
                item.get("discountedBuyNowPrice"),
                item.get("buyNowPrice"),
                item.get("minimumBid"),
                item.get("startingPrice"),
            ]
            price = 0.0
            for candidate in price_candidates:
                try:
                    candidate_price = float(candidate or 0)
                except (TypeError, ValueError):
                    continue
                if candidate_price > 0:
                    price = candidate_price
                    break
            if price <= 0:
                continue

            image_url = str(item.get("imageURL") or "").replace("\\", "/").strip()
            shipping_price = None
            try:
                shipping_price = (
                    float(item.get("shippingPrice"))
                    if item.get("shippingPrice") is not None
                    else None
                )
            except (TypeError, ValueError):
                shipping_price = None

            results.append(
                ListingCandidate(
                    source="goodwill",
                    source_item_id=item_id,
                    url=f"https://shopgoodwill.com/item/{item_id}",
                    title=title,
                    price=price,
                    condition="good",
                    image_urls=[image_url] if image_url else [],
                    description=str(item.get("description") or ""),
                    seller_name="Goodwill",
                    seller_rating=0.0,
                    location_text=str(item.get("categoryName") or "").strip(),
                    posted_at=str(item.get("startTime") or ""),
                    shipping_cost=shipping_price,
                    is_local_pickup=False,
                    is_shipped=True,
                )
            )
        except Exception:
            continue

    return results

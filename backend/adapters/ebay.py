"""eBay Browse API adapter and sold-price helper."""

from __future__ import annotations

import base64
import statistics
import time

import httpx

from backend.config import EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_MARKETPLACE
from backend.models.schemas import ListingCandidate

BROWSE_API_BASE = "https://api.ebay.com/buy/browse/v1"
AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
OAUTH_SCOPE = "https://api.ebay.com/oauth/api_scope"

_token_cache: dict[str, float | str] = {"token": "", "expires_at": 0.0}

_CONDITION_MAP = {
    "new": "new",
    "new with tags": "new",
    "new without tags": "new",
    "new with box": "new",
    "like new": "like_new",
    "very good": "like_new",
    "excellent - refurbished": "like_new",
    "manufacturer refurbished": "like_new",
    "seller refurbished": "good",
    "open box": "like_new",
    "good": "good",
    "used": "good",
    "pre-owned": "good",
    "acceptable": "fair",
    "for parts or not working": "poor",
}


async def _get_token() -> str:
    now = time.time()
    cached = str(_token_cache.get("token") or "")
    expires_at = float(_token_cache.get("expires_at") or 0.0)
    if cached and now < expires_at - 60:
        return cached

    if not EBAY_CLIENT_ID or not EBAY_CLIENT_SECRET:
        return ""

    credentials = base64.b64encode(
        f"{EBAY_CLIENT_ID}:{EBAY_CLIENT_SECRET}".encode("utf-8")
    ).decode("utf-8")

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            AUTH_URL,
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials", "scope": OAUTH_SCOPE},
        )
        response.raise_for_status()
        payload = response.json()

    token = payload.get("access_token", "")
    if not token:
        return ""
    _token_cache["token"] = token
    _token_cache["expires_at"] = now + int(payload.get("expires_in", 7200))
    return token


def _parse_item(item: dict) -> ListingCandidate | None:
    try:
        price = float(item.get("price", {}).get("value", 0) or 0)
        if price <= 0:
            return None

        raw_condition = str(item.get("condition", "used")).strip().lower()
        condition = _CONDITION_MAP.get(raw_condition, "good")

        image_urls: list[str] = []
        if item.get("image", {}).get("imageUrl"):
            image_urls.append(item["image"]["imageUrl"])
        for thumbnail in item.get("thumbnailImages", []) or []:
            image_url = thumbnail.get("imageUrl")
            if image_url and image_url not in image_urls:
                image_urls.append(image_url)

        seller = item.get("seller", {}) or {}
        feedback_pct = float(str(seller.get("feedbackPercentage", "0")).replace("%", "") or 0)
        location = item.get("itemLocation", {}) or {}
        location_text = ", ".join(
            value for value in [location.get("city", ""), location.get("stateOrProvince", "")] if value
        )
        buying_options = {str(option) for option in item.get("buyingOptions", []) or []}

        return ListingCandidate(
            source="ebay",
            source_item_id=str(item.get("itemId", "")),
            url=str(item.get("itemWebUrl", "")),
            title=str(item.get("title", "")),
            price=price,
            condition=condition,
            image_urls=image_urls,
            description=str(item.get("shortDescription", "")),
            seller_name=str(seller.get("username", "")),
            seller_rating=round(feedback_pct / 20.0, 1) if feedback_pct else 0.0,
            seller_review_count=int(seller.get("feedbackScore", 0) or 0),
            location_text=location_text,
            is_local_pickup="LOCAL_PICKUP" in buying_options,
            is_shipped=True,
        )
    except Exception:
        return None


async def search_ebay(
    query: str,
    max_price: float = 0,
    zip_code: str = "",
    limit: int = 20,
) -> list[ListingCandidate]:
    token = await _get_token()
    if not token:
        return []

    filters = ["buyingOptions:{FIXED_PRICE|BEST_OFFER|AUCTION}"]
    if max_price > 0:
        filters.append(f"price:[0..{int(max_price)}],priceCurrency:USD")

    params: dict[str, str] = {
        "q": query,
        "filter": ",".join(filters),
        "limit": str(limit),
        "sort": "newlyListed",
        "fieldgroups": "MATCHING_ITEMS,FULL",
    }
    if zip_code:
        params["buyerPostalCode"] = zip_code

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{BROWSE_API_BASE}/item_summary/search",
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE,
            },
            params=params,
        )
        response.raise_for_status()
        payload = response.json()

    parsed = [_parse_item(item) for item in payload.get("itemSummaries", [])]
    return [listing for listing in parsed if listing is not None]


async def get_ebay_sold_prices(query: str, limit: int = 20) -> list[float]:
    token = await _get_token()
    if not token:
        return []

    params = {
        "q": query,
        "filter": "soldItems:true",
        "limit": str(limit),
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{BROWSE_API_BASE}/item_summary/search",
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE,
            },
            params=params,
        )
        if response.status_code != 200:
            return []
        payload = response.json()

    prices: list[float] = []
    for item in payload.get("itemSummaries", []):
        try:
            prices.append(float(item["price"]["value"]))
        except Exception:
            continue
    return prices


async def get_ebay_sold_summary(query: str) -> tuple[float, float, float]:
    prices = await get_ebay_sold_prices(query)
    if not prices:
        return 0.0, 0.0, 0.0
    ordered = sorted(prices)
    median = statistics.median(ordered)
    low = ordered[max(0, len(ordered) // 5)]
    high = ordered[min(len(ordered) - 1, (len(ordered) * 4) // 5)]
    return float(median), float(low), float(high)

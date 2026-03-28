"""eBay Browse API adapter — Official API, OAuth client credentials."""

import base64
import time
import httpx
from backend.models.schemas import ListingCandidate
from backend.config import EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_MARKETPLACE

BROWSE_API_BASE = "https://api.ebay.com/buy/browse/v1"
AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
OAUTH_SCOPE = "https://api.ebay.com/oauth/api_scope"

# In-memory token cache (lasts ~2h, refresh 60s early)
_token_cache: dict = {"token": "", "expires_at": 0.0}

_CONDITION_MAP = {
    "New": "new",
    "Like New": "like_new",
    "Very Good": "like_new",
    "Good": "good",
    "Acceptable": "fair",
    "For parts or not working": "poor",
    "Manufacturer Refurbished": "like_new",
    "Seller Refurbished": "good",
    "Open Box": "like_new",
    "Used": "good",
    "Pre-Owned": "good",
}

# eBay category IDs for discovery rails
CATEGORY_IDS = {
    "Electronics": "293",      # Consumer Electronics
    "Furniture": "3197",        # Furniture
    "Sports": "888",            # Sporting Goods
}


async def _get_token() -> str:
    """Fetch or return cached OAuth client-credentials token."""
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    if not EBAY_CLIENT_ID or not EBAY_CLIENT_SECRET:
        return ""

    credentials = base64.b64encode(
        f"{EBAY_CLIENT_ID}:{EBAY_CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            AUTH_URL,
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"grant_type": "client_credentials", "scope": OAUTH_SCOPE},
        )
        resp.raise_for_status()
        data = resp.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + int(data.get("expires_in", 7200))
    return _token_cache["token"]


def _parse_item(item: dict) -> ListingCandidate | None:
    """Convert a raw eBay item summary into ListingCandidate."""
    try:
        price_obj = item.get("price", {})
        price = float(price_obj.get("value", 0))
        if price <= 0:
            return None

        condition_raw = item.get("condition", "Used")
        condition = _CONDITION_MAP.get(condition_raw, "good")

        image_urls: list[str] = []
        if item.get("thumbnailImages"):
            image_urls = [img["imageUrl"] for img in item["thumbnailImages"]]
        elif item.get("image"):
            image_urls = [item["image"]["imageUrl"]]

        seller = item.get("seller", {})
        feedback_pct = float(seller.get("feedbackPercentage", "0").replace("%", "") or 0)
        # Convert 0–100 feedback% to 0–5 star scale
        seller_rating = round(feedback_pct / 20, 1)

        location = item.get("itemLocation", {})
        location_text = ", ".join(
            filter(None, [location.get("city", ""), location.get("stateOrProvince", "")])
        )

        buying_options = item.get("buyingOptions", [])
        is_local = "LOCAL_PICKUP" in buying_options

        return ListingCandidate(
            source="ebay",
            source_item_id=item.get("itemId", ""),
            url=item.get("itemWebUrl", ""),
            title=item.get("title", ""),
            price=price,
            condition=condition,
            image_urls=image_urls,
            description=item.get("shortDescription", ""),
            seller_name=seller.get("username", ""),
            seller_rating=seller_rating,
            location_text=location_text,
            posted_at="",
            is_local_pickup=is_local,
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
    """Search eBay for used listings matching query."""
    token = await _get_token()
    if not token:
        return []

    filter_parts = ["buyingOptions:{FIXED_PRICE|AUCTION}"]
    if max_price > 0:
        filter_parts.append(f"price:[0..{max_price:.0f}],priceCurrency:USD")

    params: dict = {
        "q": query,
        "filter": ",".join(filter_parts),
        "limit": str(limit),
        "sort": "price",
        "fieldgroups": "MATCHING_ITEMS,FULL",
    }
    if zip_code:
        params["buyerPostalCode"] = zip_code

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BROWSE_API_BASE}/item_summary/search",
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE,
            },
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("itemSummaries", []):
        parsed = _parse_item(item)
        if parsed:
            results.append(parsed)

    return results


async def search_ebay_trending(
    category_name: str,
    zip_code: str = "",
    limit: int = 12,
) -> list[ListingCandidate]:
    """Fetch trending eBay listings by category ID for the Discovery screen."""
    token = await _get_token()
    if not token:
        return []

    category_id = CATEGORY_IDS.get(category_name, "")
    if not category_id:
        return []

    params: dict = {
        "category_ids": category_id,
        "filter": "buyingOptions:{FIXED_PRICE|AUCTION}",
        "limit": str(limit),
        "sort": "newlyListed",
    }
    if zip_code:
        params["buyerPostalCode"] = zip_code

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{BROWSE_API_BASE}/item_summary/search",
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE,
            },
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    results = []
    for item in data.get("itemSummaries", []):
        parsed = _parse_item(item)
        if parsed:
            results.append(parsed)

    return results


async def get_ebay_sold_prices(query: str, limit: int = 10) -> list[float]:
    """Return list of recently sold eBay prices for fair value estimation."""
    token = await _get_token()
    if not token:
        return []

    params = {
        "q": query,
        "filter": "soldItems:true",
        "limit": str(limit),
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{BROWSE_API_BASE}/item_summary/search",
            headers={
                "Authorization": f"Bearer {token}",
                "X-EBAY-C-MARKETPLACE-ID": EBAY_MARKETPLACE,
            },
            params=params,
        )
        if resp.status_code != 200:
            return []
        data = resp.json()

    prices = []
    for item in data.get("itemSummaries", []):
        try:
            prices.append(float(item["price"]["value"]))
        except (KeyError, ValueError):
            pass

    return prices

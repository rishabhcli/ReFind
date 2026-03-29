"""Mercari adapter with API-first search and browser fallback."""

from __future__ import annotations

import re
import uuid
from urllib.parse import quote_plus

import httpx

from backend.models.schemas import ListingCandidate

MERCARI_SEARCH_URL = "https://api.mercari.jp/v2/entities:search"

_CONDITION_MAP = {
    1: "new",
    2: "like_new",
    3: "good",
    4: "fair",
    5: "poor",
    "ITEM_CONDITION_NEW": "new",
    "ITEM_CONDITION_LIKE_NEW": "like_new",
    "ITEM_CONDITION_GOOD": "good",
    "ITEM_CONDITION_FAIR": "fair",
    "ITEM_CONDITION_POOR": "poor",
}


def _browser_item_to_listing(item: dict[str, object], index: int) -> ListingCandidate | None:
    listing_url = str(item.get("url") or "").strip()
    title = str(item.get("title") or "").strip()
    if not listing_url or not title:
        return None

    price_match = re.search(r"\$?([\d,.]+)", str(item.get("price_text") or ""))
    if not price_match:
        return None

    price = float(price_match.group(1).replace(",", ""))
    if price <= 0:
        return None

    item_id_match = re.search(r"/item/([^/?#]+)/?", listing_url)
    item_id = item_id_match.group(1) if item_id_match else f"mercari-{index}"
    image_url = str(item.get("image_url") or "").strip()

    return ListingCandidate(
        source="mercari",
        source_item_id=item_id,
        url=listing_url,
        title=title,
        price=price,
        condition="good",
        image_urls=[image_url] if image_url else [],
        description="",
        seller_name="",
        seller_rating=0.0,
        location_text="",
        is_local_pickup=False,
        is_shipped=True,
    )


async def _search_mercari_browser(query: str, max_price: float = 0) -> list[ListingCandidate]:
    search_url = f"https://www.mercari.com/search/?keyword={quote_plus(query)}"
    from backend.browser import acquire_page, init_browser, release_page  # lazy import
    await init_browser()
    page = await acquire_page()
    try:
        await page.goto(search_url, wait_until="domcontentloaded", timeout=45_000)
        await page.wait_for_timeout(4_000)
        await page.evaluate("window.scrollBy(0, window.innerHeight);")
        await page.wait_for_timeout(1_500)
        await page.evaluate("window.scrollBy(0, window.innerHeight * 2);")
        await page.wait_for_timeout(1_500)

        if "security verification" in (await page.locator("body").inner_text()).lower():
            return []

        raw_items = await page.evaluate(
            """() => {
                return Array.from(document.querySelectorAll('a[href*="/item/"]'))
                    .map((anchor) => {
                        const href = anchor.href
                            ? anchor.href
                            : new URL(anchor.getAttribute('href') || '', window.location.origin).toString();
                        const texts = Array.from(anchor.querySelectorAll('span, p, div'))
                            .map((node) => (node.textContent || '').trim())
                            .filter(Boolean);
                        const title = (anchor.getAttribute('title') || '').trim()
                            || anchor.querySelector('img')?.alt
                            || texts.find((text) => !text.startsWith('$'))
                            || '';
                        const priceText = texts.find((text) => /^\\$?\\d/.test(text)) || '';
                        
                        const img = anchor.querySelector('img');
                        let imgUrl = img?.getAttribute('src') || img?.src || '';
                        if (imgUrl.startsWith('data:image') || imgUrl.length < 50) {
                            imgUrl = img?.getAttribute('data-src') || img?.getAttribute('srcset')?.split(' ')[0] || imgUrl;
                        }

                        return {
                            url: href,
                            title,
                            price_text: priceText,
                            image_url: imageUrl,
                        };
                    })
                    .filter((item) => item.url && item.title && item.price_text);
            }"""
        )
    finally:
        await release_page(page)

    results: list[ListingCandidate] = []
    seen_urls: set[str] = set()
    for index, item in enumerate(raw_items or []):
        if max_price > 0:
            price_match = re.search(r"\$?([\d,.]+)", str(item.get("price_text") or ""))
            if not price_match:
                continue
            if float(price_match.group(1).replace(",", "")) > max_price:
                continue

        listing = _browser_item_to_listing(item, index)
        if listing and listing.url not in seen_urls:
            seen_urls.add(listing.url)
            results.append(listing)

    return results[:20]


async def search_mercari(query: str, max_price: float = 0) -> list[ListingCandidate]:
    """Search Mercari for active listings matching query."""
    search_condition: dict[str, object] = {
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

    data: dict[str, object] | None = None
    try:
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
    except Exception:
        data = None

    results: list[ListingCandidate] = []
    for item in (data or {}).get("items", []):
        try:
            price = float(item.get("price", 0))
            if price <= 0:
                continue

            cond_raw = item.get("itemConditionId", 3)
            condition = _CONDITION_MAP.get(cond_raw, "good")
            image_urls: list[str] = []
            if item.get("thumbnails"):
                image_urls = list(item["thumbnails"])[:3]
            elif item.get("photos"):
                image_urls = [
                    photo.get("imageUrl", "")
                    for photo in item["photos"][:3]
                    if photo.get("imageUrl")
                ]

            item_id = item.get("id", "")
            seller = item.get("seller", {})
            rating = float(seller.get("starRating", 0) or 0)

            results.append(
                ListingCandidate(
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
                )
            )
        except Exception:
            continue

    if results:
        return results[:20]

    # Browser fallback — silently skip if browser is unavailable (e.g. Windows Store Python)
    try:
        return await _search_mercari_browser(query, max_price=max_price)
    except Exception:
        return []

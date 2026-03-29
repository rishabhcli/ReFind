"""OfferUp adapter backed by the shared Playwright browser context."""

from __future__ import annotations

import re
from urllib.parse import quote_plus

from backend.browser import acquire_page, init_browser, release_page
from backend.models.schemas import ListingCandidate


async def search_offerup(
    query: str,
    max_price: float = 0,
    location: str = "",
    radius_miles: int = 25,
) -> list[ListingCandidate]:
    del location, radius_miles

    search_url = f"https://offerup.com/search/?q={quote_plus(query)}"
    if max_price > 0:
        search_url += f"&price_max={int(max_price)}"

    await init_browser()
    page = await acquire_page()
    try:
        await page.goto(search_url, wait_until="domcontentloaded", timeout=45_000)
        await page.wait_for_timeout(4_000)
        await page.evaluate("window.scrollBy(0, window.innerHeight);")
        await page.wait_for_timeout(1_500)
        await page.evaluate("window.scrollBy(0, window.innerHeight * 2);")
        await page.wait_for_timeout(1_500)

        raw_items = await page.evaluate(
            """() => {
                return Array.from(document.querySelectorAll('a[href*="/item/detail/"]'))
                    .map((anchor) => {
                        const spans = Array.from(anchor.querySelectorAll('span'))
                            .map((span) => (span.textContent || '').trim())
                            .filter(Boolean);
                        const deduped = [...new Set(spans)];
                        const title = (anchor.getAttribute('title') || '').trim()
                            || deduped.find((text) => !text.startsWith('$') && !text.includes('$'))
                            || '';
                        const priceText = deduped.find((text) => /^\\$\\d/.test(text)) || '';
                        const placeText = deduped
                            .filter((text) => text !== title && text !== priceText && !text.includes('$'))
                            .slice(-1)[0] || '';
                        
                        const img = anchor.querySelector('img');
                        let imgUrl = img?.getAttribute('src') || img?.src || '';
                        if (imgUrl.startsWith('data:image') || imgUrl.length < 50) {
                            imgUrl = img?.getAttribute('data-src') || img?.getAttribute('srcset')?.split(' ')[0] || imgUrl;
                        }

                        const href = anchor.href
                            ? anchor.href
                            : new URL(anchor.getAttribute('href') || '', window.location.origin).toString();
                        return {
                            url: href,
                            title,
                            price_text: priceText,
                            location: placeText,
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
        try:
            listing_url = str(item.get("url") or "").strip()
            if not listing_url or listing_url in seen_urls:
                continue

            price_match = re.search(r"\$([\d,.]+)", str(item.get("price_text") or ""))
            if not price_match:
                continue

            price = float(price_match.group(1).replace(",", ""))
            if price <= 0:
                continue

            source_id_match = re.search(r"/item/detail/([^/?#]+)", listing_url)
            source_id = source_id_match.group(1) if source_id_match else f"offerup-{index}"
            image_url = str(item.get("image_url") or "").strip()
            seen_urls.add(listing_url)

            results.append(
                ListingCandidate(
                    source="offerup",
                    source_item_id=source_id,
                    url=listing_url,
                    title=str(item.get("title") or "").strip(),
                    price=price,
                    condition="good",
                    image_urls=[image_url] if image_url else [],
                    description="",
                    seller_name="",
                    seller_rating=0.0,
                    location_text=str(item.get("location") or "").strip(),
                    is_local_pickup=True,
                    is_shipped=True,
                )
            )
        except Exception:
            continue

    return results[:10]

"""Facebook Marketplace adapter using an anonymous Playwright context."""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import quote_plus

from backend.models.schemas import ListingCandidate

SESSION_FILE = Path(__file__).parent.parent / "fb_session.json"


async def search_facebook(query: str, max_price: float = 0) -> list[ListingCandidate]:
    """Search Facebook Marketplace without requiring a logged-in session."""
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return []

    search_url = (
        "https://www.facebook.com/marketplace/search"
        f"?query={quote_plus(query)}"
        f"{f'&maxPrice={int(max_price)}' if max_price > 0 else ''}"
        "&sortBy=creation_time_descend"
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        try:
            await page.goto(search_url, wait_until="domcontentloaded", timeout=45_000)
            try:
                await page.wait_for_selector('a[href*="/marketplace/item/"]', timeout=10_000)
            except Exception:
                await page.wait_for_timeout(4_000)
            
            await page.evaluate("window.scrollBy(0, window.innerHeight);")
            await page.wait_for_timeout(2_000)
            await page.evaluate("window.scrollBy(0, window.innerHeight * 2);")
            await page.wait_for_timeout(2_000)

            raw_items = await page.evaluate(
                """() => {
                    return Array.from(document.querySelectorAll('a[href*="/marketplace/item/"]'))
                        .map((anchor) => {
                            const visibleTexts = Array.from(anchor.querySelectorAll('span[dir="auto"]'))
                                .map((span) => (span.textContent || '').trim())
                                .filter(Boolean);
                            const image = anchor.querySelector('img');
                            let imgUrl = image?.getAttribute('src') || image?.src || '';
                            if (imgUrl.startsWith('data:image') || imgUrl.length < 50) {
                                imgUrl = image?.getAttribute('data-src') || image?.getAttribute('srcset')?.split(' ')[0] || imgUrl;
                            }
                            const rawText = (anchor.textContent || '').trim();
                            return {
                                url: anchor.href
                                    ? anchor.href
                                    : new URL(anchor.getAttribute('href') || '', window.location.origin).toString(),
                                spans: visibleTexts,
                                image_url: imgUrl,
                                raw_text: rawText,
                            };
                        })
                        .filter((item) =>
                            item.url &&
                            item.spans.length >= 2 &&
                            !/partner listing/i.test(item.raw_text)
                        );
                }"""
            )
        finally:
            await browser.close()

    results: list[ListingCandidate] = []
    seen_urls: set[str] = set()
    for index, item in enumerate(raw_items or []):
        try:
            listing_url = str(item.get("url") or "").strip()
            if not listing_url or listing_url in seen_urls:
                continue

            spans = [str(value).strip() for value in item.get("spans") or [] if str(value).strip()]
            price_text = next((value for value in spans if value.startswith("$")), "")
            if not price_text:
                continue

            price_match = re.search(r"\$([\d,.]+(?:\.\d{2})?)", price_text)
            if not price_match:
                continue

            price = float(price_match.group(1).replace(",", ""))
            if price <= 0 or (max_price > 0 and price > max_price):
                continue

            non_price_texts = [value for value in spans if not value.startswith("$")]
            if not non_price_texts:
                continue

            title = non_price_texts[0]
            location_text = non_price_texts[1] if len(non_price_texts) > 1 else ""
            source_id_match = re.search(r"/item/(\d+)", listing_url)
            source_id = source_id_match.group(1) if source_id_match else f"facebook-{index}"
            image_url = str(item.get("image_url") or "").strip()
            seen_urls.add(listing_url)

            results.append(
                ListingCandidate(
                    source="facebook",
                    source_item_id=source_id,
                    url=listing_url,
                    title=title,
                    price=price,
                    condition="good",
                    image_urls=[image_url] if image_url else [],
                    description="",
                    seller_name="",
                    seller_rating=0.0,
                    location_text=location_text,
                    is_local_pickup=location_text.lower() != "ships to you" if location_text else True,
                    is_shipped=location_text.lower() == "ships to you" if location_text else False,
                )
            )
        except Exception:
            continue

    return results[:10]


if __name__ == "__main__":
    import asyncio
    import sys

    async def setup_session() -> None:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            print("Install playwright first: pip install playwright && playwright install chromium")
            sys.exit(1)

        print("Opening browser. Log into Facebook, then press Enter here.")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            context = await browser.new_context()
            page = await context.new_page()
            await page.goto("https://www.facebook.com/login")
            input("Press Enter after logging in...")
            await context.storage_state(path=str(SESSION_FILE))
            await browser.close()
        print(f"Session saved to {SESSION_FILE}")

    asyncio.run(setup_session())

"""Facebook Marketplace adapter — Playwright with saved session cookie.

Setup (one-time):
  1. Run: python -m backend.adapters.facebook --setup
  2. Log into Facebook in the browser that opens
  3. Press Enter in the terminal — session saved to backend/fb_session.json
"""

import json
import re
from pathlib import Path
from backend.models.schemas import ListingCandidate

SESSION_FILE = Path(__file__).parent.parent / "fb_session.json"


async def search_facebook(query: str, max_price: float = 0) -> list[ListingCandidate]:
    """Search Facebook Marketplace using a saved Playwright browser session."""
    if not SESSION_FILE.exists():
        # Session not set up — skip silently
        return []

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return []

    price_param = f"&maxPrice={int(max_price)}" if max_price > 0 else ""
    url = (
        f"https://www.facebook.com/marketplace/search"
        f"?query={query.replace(' ', '%20')}{price_param}&sortBy=creation_time_descend"
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(storage_state=str(SESSION_FILE))
        page = await context.new_page()

        try:
            await page.goto(url, timeout=20_000)
            await page.wait_for_timeout(3_000)

            # Extract listing cards via JS evaluation
            raw = await page.evaluate(
                """() => {
                    const cards = document.querySelectorAll(
                        'div[data-testid="marketplace_feed_item"], ' +
                        'div[aria-label][role="listitem"], ' +
                        'div.x3ct3a4 a[href*="/marketplace/item/"]'
                    );
                    return Array.from(cards).slice(0, 10).map(card => {
                        const link = card.querySelector('a[href*="/marketplace/item/"]') || card.closest('a');
                        const img = card.querySelector('img');
                        const spans = Array.from(card.querySelectorAll('span')).map(s => s.textContent.trim()).filter(Boolean);
                        return {
                            url: link ? 'https://www.facebook.com' + (link.getAttribute('href') || '') : '',
                            image_url: img ? img.src : '',
                            texts: spans.slice(0, 6)
                        };
                    });
                }"""
            )
        finally:
            await browser.close()

    results = []
    for i, card in enumerate(raw or []):
        texts: list[str] = card.get("texts", [])
        if not texts:
            continue

        # Heuristically parse: first text with $ is price, rest is title
        price = 0.0
        title = ""
        location = ""
        for text in texts:
            price_match = re.search(r"\$(\d[\d,]*)", text)
            if price_match and price == 0.0:
                price = float(price_match.group(1).replace(",", ""))
            elif not title and len(text) > 3 and "$" not in text:
                title = text
            elif title and not location and len(text) > 2:
                location = text

        if price <= 0 or not title:
            continue

        item_url = card.get("url", "")
        item_id = re.search(r"/item/(\d+)", item_url)
        source_id = item_id.group(1) if item_id else f"fb-{i}"

        results.append(ListingCandidate(
            source="facebook",
            source_item_id=source_id,
            url=item_url,
            title=title,
            price=price,
            condition="good",
            image_urls=[card.get("image_url", "")] if card.get("image_url") else [],
            description="",
            seller_name="",
            seller_rating=0.0,
            location_text=location,
            is_local_pickup=True,
            is_shipped=False,
        ))

    return results


# ── One-time session setup helper ───────────────────────────────
if __name__ == "__main__":
    import asyncio
    import sys

    async def setup_session():
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            print("Install playwright first: pip install playwright && playwright install chromium")
            sys.exit(1)

        print("Opening browser — log into Facebook, then press Enter here.")
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

"""Phase 4 — Browser-use enrichment of top-ranked listings.

Opens each listing URL in a browser tab to extract: full description,
seller details, shipping/pickup, additional images, condition notes.

Provides two modes:
  enrich_listing()       — uses browser-use Agent (LLM-driven extraction)
  enrich_single()        — uses raw Playwright JS evaluation
  enrich_top_listings()  — orchestrates top-N via enrich_single
"""

import asyncio
import logging

from backend.browser import acquire_page, release_page
from backend.models.schemas import ListingCandidate

logger = logging.getLogger(__name__)


async def enrich_listing(listing: ListingCandidate) -> ListingCandidate:
    """Enrich a single listing by reading its full page with browser-use."""
    from backend.tools.browser_agent import run_browser_task, extract_json_object

    task = f"""
    Navigate to this listing URL: {listing.url}

    Extract and return as JSON:
    {{
      "full_description": "complete item description the seller wrote",
      "condition_notes": "any condition details the seller mentioned",
      "seller_username": "seller's username or handle",
      "seller_rating": <float 0-5 if visible>,
      "seller_review_count": <int if visible>,
      "shipping_cost": <float or null if free or not shown>,
      "pickup_available": <true/false if local pickup mentioned>,
      "pickup_location": "city or neighborhood if shown",
      "payment_notes": "any notes about payment or meeting",
      "additional_images": ["url1", "url2", ...]
    }}

    Only extract what is actually visible on the page. Do not navigate away.
    Return valid JSON only.
    """

    try:
        raw, _ = await run_browser_task(task, max_steps=8)
        data = extract_json_object(raw)
        if data:
            if data.get("full_description"):
                listing.full_description = data["full_description"]
            if data.get("condition_notes"):
                listing.condition_notes = data["condition_notes"]
            if data.get("seller_username"):
                listing.seller_username = data["seller_username"]
            if data.get("seller_rating") and listing.seller_rating == 0:
                listing.seller_rating = float(data["seller_rating"])
            if data.get("seller_review_count") and listing.seller_review_count == 0:
                listing.seller_review_count = int(data["seller_review_count"])
            if data.get("shipping_cost") is not None:
                listing.shipping_cost = float(data["shipping_cost"])
            if data.get("pickup_available") is not None:
                listing.pickup_available = bool(data["pickup_available"])
            if data.get("payment_notes"):
                listing.payment_notes = data["payment_notes"]
            if data.get("additional_images"):
                existing = set(listing.image_urls)
                for img in data["additional_images"]:
                    if img not in existing:
                        listing.additional_images.append(img)
    except Exception:
        pass  # Enrichment failure is non-fatal

    return listing


async def enrich_single(listing: ListingCandidate) -> ListingCandidate:
    """Open a listing URL in a browser page and enrich with detailed data."""
    if not listing.url:
        return listing

    page = None
    try:
        page = await acquire_page()
        await page.goto(listing.url, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(2000)

        data = await page.evaluate("""
        () => {
            const getText = (sel) => {
                const el = document.querySelector(sel);
                return el ? el.textContent.trim() : '';
            };
            const getImgs = (sel) =>
                [...document.querySelectorAll(sel)]
                    .map(img => img.src || img.dataset.src)
                    .filter(Boolean);

            const desc = getText(
                '[data-testid="description"], .item-description, ' +
                '#description, [class*="Description"], [class*="description"]'
            );
            const sellerName = getText(
                '[data-testid="seller-name"], .seller-name, ' +
                '[class*="SellerName"], [class*="seller-name"]'
            );
            const shipping = getText(
                '[class*="shipping"], [class*="Shipping"], [data-testid*="shipping"]'
            );
            const pickup = getText(
                '[class*="pickup"], [class*="Pickup"], [class*="local"]'
            );
            const images = getImgs(
                'img[class*="gallery"], img[class*="Gallery"], ' +
                'img[class*="photo"], img[class*="Photo"], ' +
                '[class*="carousel"] img, [class*="slider"] img'
            );
            const condNotes = getText('[class*="condition"], [class*="Condition"]');
            const payment = getText('[class*="payment"], [class*="Payment"]');

            return {
                full_description: desc,
                seller_username: sellerName,
                shipping_text: shipping,
                pickup_text: pickup,
                additional_images: images.slice(0, 10),
                condition_notes: condNotes,
                payment_notes: payment,
            };
        }
        """)

        if data.get("full_description"):
            listing.full_description = data["full_description"][:2000]
        if data.get("condition_notes"):
            listing.condition_notes = data["condition_notes"]
        if data.get("seller_username"):
            listing.seller_username = data["seller_username"]
        if data.get("additional_images"):
            listing.additional_images = data["additional_images"][:10]
            listing.image_urls = list(set(listing.image_urls + listing.additional_images))

        shipping_text = (data.get("shipping_text") or "").lower()
        pickup_text = (data.get("pickup_text") or "").lower()
        if "ship" in shipping_text or "deliver" in shipping_text:
            listing.is_shipped = True
        if "pickup" in pickup_text or "local" in pickup_text or "meet" in pickup_text:
            listing.pickup_available = True

        if data.get("payment_notes"):
            listing.payment_notes = data["payment_notes"]

        return listing

    except Exception as exc:
        logger.error("Enrichment failed for %s: %s", listing.url, exc)
        return listing
    finally:
        if page is not None:
            await release_page(page)


async def enrich_top_listings(
    listings: list[ListingCandidate],
    top_n: int = 3,
) -> list[ListingCandidate]:
    """Enrich the top N listings via browser, return full list."""
    if not listings:
        return listings

    to_enrich = listings[:top_n]
    rest = listings[top_n:]

    enriched = await asyncio.gather(
        *[enrich_single(l) for l in to_enrich],
        return_exceptions=True,
    )

    result: list[ListingCandidate] = []
    for i, item in enumerate(enriched):
        if isinstance(item, Exception):
            logger.error("Enrichment %d failed: %s", i, item)
            result.append(to_enrich[i])
        else:
            result.append(item)

    result.extend(rest)
    return result

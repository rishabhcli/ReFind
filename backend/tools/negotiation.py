"""Negotiation flow — strategy generation, browser messaging, reply monitoring."""

import asyncio
import logging
import re
from typing import Optional

from backend.browser import acquire_page, release_page
from backend.models.schemas import ListingCandidate, NegotiationStrategy

logger = logging.getLogger(__name__)


def generate_strategy(
    listing: ListingCandidate,
    user_name: str = "Buyer",
) -> NegotiationStrategy:
    """Generate a negotiation strategy based on listing scores."""
    recommended = listing.recommended_offer or listing.price * 0.85
    walk_away = listing.price * 0.95

    if listing.deal_score >= 75:
        tone = "friendly"
        opening_pct = 0.12
    elif listing.deal_score >= 50:
        tone = "casual"
        opening_pct = 0.18
    else:
        tone = "firm"
        opening_pct = 0.20

    offer_price = round(listing.price * (1 - opening_pct), 2)

    message = (
        f"Hi {listing.seller_name or 'there'},\n\n"
        f"I'm interested in your {listing.title}. "
    )
    if offer_price < listing.price:
        message += f"Would you consider ${offer_price:.0f}? "
    message += (
        "I can pick up at your convenience and pay cash. "
        "Let me know if it's still available!\n\n"
        f"Thanks,\n{user_name}"
    )

    return NegotiationStrategy(
        listing_id=listing.source_item_id,
        seller_name=listing.seller_name or "Seller",
        opening_message=message,
        recommended_offer=offer_price,
        walk_away_price=round(walk_away, 2),
        tone=tone,
        requires_approval=True,
    )


async def send_message_via_browser(
    listing_url: str,
    message_text: str,
    source: str,
) -> dict:
    """Navigate to listing and send a message via the platform's contact UI."""
    page = None
    try:
        page = await acquire_page()
        await page.goto(listing_url, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(2000)

        contact_selectors = {
            "ebay": 'a[href*="contact"], button:has-text("Contact seller")',
            "facebook": 'div[aria-label*="Message"], button:has-text("Message")',
            "offerup": 'button:has-text("Make offer"), button:has-text("Message")',
            "craigslist": 'a[class*="reply"], button:has-text("Reply")',
            "poshmark": 'button:has-text("Comment"), button:has-text("Ask")',
            "mercari": 'button:has-text("Message"), button:has-text("Make offer")',
        }
        selector = contact_selectors.get(
            source, 'button:has-text("Message"), button:has-text("Contact")'
        )

        btn = await page.query_selector(selector)
        if not btn:
            return {"success": False, "error": f"Contact button not found on {source}"}

        await btn.click()
        await page.wait_for_timeout(1500)

        textarea = await page.query_selector(
            'textarea, [contenteditable="true"], [role="textbox"], input[type="text"]'
        )
        if not textarea:
            return {"success": False, "error": "Message input field not found"}

        await textarea.fill(message_text)
        await page.wait_for_timeout(500)

        send_btn = await page.query_selector(
            'button:has-text("Send"), button[type="submit"], '
            'button[aria-label*="Send"], button[aria-label*="send"]'
        )
        if send_btn:
            await send_btn.click()
            await page.wait_for_timeout(1000)
            return {"success": True}
        return {"success": False, "error": "Send button not found"}

    except Exception as exc:
        logger.error("Message sending failed for %s: %s", listing_url, exc)
        return {"success": False, "error": str(exc)}
    finally:
        if page is not None:
            await release_page(page)


async def check_for_reply(
    listing_url: str,
    source: str,
    recommended_offer: float,
    walk_away_price: float,
) -> dict:
    """Check for seller reply and classify it: accept / counter / escalate."""
    page = None
    try:
        page = await acquire_page()
        await page.goto(listing_url, wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)

        reply_text = await page.evaluate("""
        () => {
            const msgs = document.querySelectorAll(
                '[class*="message"], [class*="Message"], [class*="reply"]'
            );
            const texts = [...msgs].map(m => m.textContent.trim()).filter(Boolean);
            return texts.length > 1 ? texts[texts.length - 1] : '';
        }
        """)

        if not reply_text:
            return {"has_reply": False, "reply_text": "", "action": "wait"}

        price_match = re.search(r'\$?([\d,]+(?:\.\d{2})?)', reply_text)
        counter_price = float(price_match.group(1).replace(",", "")) if price_match else 0

        if counter_price > 0:
            if counter_price <= recommended_offer * 1.05:
                action = "accept"
            elif counter_price <= walk_away_price:
                action = "counter"
            else:
                action = "escalate"
        else:
            action = "escalate"

        return {"has_reply": True, "reply_text": reply_text[:500], "counter_price": counter_price, "action": action}
    except Exception as exc:
        logger.error("Reply check failed: %s", exc)
        return {"has_reply": False, "action": "error", "error": str(exc)}
    finally:
        if page is not None:
            await release_page(page)

"""OfferUp adapter — browser-use (Playwright) for light bot-detection bypass."""

import json
import re
from backend.models.schemas import ListingCandidate


async def search_offerup(query: str, max_price: float = 0) -> list[ListingCandidate]:
    """Use browser-use to search OfferUp and extract listing cards."""
    try:
        from browser_use import Agent
        from browser_use.browser.browser import Browser, BrowserConfig
        from langchain_openai import ChatOpenAI
        from backend.config import DO_INFERENCE_API_KEY, DO_INFERENCE_BASE_URL, MODEL_NAME
    except ImportError:
        return []

    if not DO_INFERENCE_API_KEY:
        return []

    price_filter = f"&price_max={int(max_price)}" if max_price > 0 else ""
    url = f"https://offerup.com/search/?q={query.replace(' ', '+')}{price_filter}"

    task = (
        f"Go to {url}\n"
        "Wait for the listing cards to load (up to 5 seconds).\n"
        "For each listing card (up to 10), extract:\n"
        "  - title: the item name\n"
        "  - price: numeric price in USD (digits only, no $ sign)\n"
        "  - condition: condition label if shown, else 'good'\n"
        "  - seller_name: seller username if visible, else empty string\n"
        "  - location: city or area text if shown, else empty string\n"
        "  - image_url: the thumbnail src URL\n"
        "  - url: the full listing URL (href of the card link)\n"
        "Return ONLY a JSON array of objects with those fields, no other text."
    )

    llm = ChatOpenAI(
        model=MODEL_NAME,
        base_url=DO_INFERENCE_BASE_URL,
        api_key=DO_INFERENCE_API_KEY,
        temperature=0,
    )

    browser = Browser(config=BrowserConfig(headless=True))
    try:
        agent = Agent(task=task, llm=llm, browser=browser)
        result = await agent.run(max_steps=12)
        raw_text = result.final_result() if hasattr(result, "final_result") else str(result)
    finally:
        await browser.close()

    # Extract JSON array from result
    match = re.search(r"\[.*\]", raw_text, re.DOTALL)
    if not match:
        return []

    try:
        items = json.loads(match.group())
    except (json.JSONDecodeError, ValueError):
        return []

    results = []
    for i, item in enumerate(items):
        try:
            raw_price = str(item.get("price", "0")).replace("$", "").replace(",", "").strip()
            price = float(raw_price) if raw_price else 0.0
            if price <= 0:
                continue

            condition = str(item.get("condition", "good")).lower()
            if condition not in {"new", "like_new", "good", "fair", "poor"}:
                condition = "good"

            image_url = item.get("image_url", "")
            results.append(ListingCandidate(
                source="offerup",
                source_item_id=f"ou-{i}-{abs(hash(item.get('url', str(i))))}",
                url=item.get("url", ""),
                title=item.get("title", ""),
                price=price,
                condition=condition,
                image_urls=[image_url] if image_url else [],
                description="",
                seller_name=item.get("seller_name", ""),
                seller_rating=0.0,
                location_text=item.get("location", ""),
                is_local_pickup=True,
                is_shipped=True,
            ))
        except Exception:
            continue

    return results

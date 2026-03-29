"""Craigslist adapter using the current server-rendered search markup."""

from __future__ import annotations

import json
import re

import httpx
from bs4 import BeautifulSoup

from backend.models.schemas import ListingCandidate

# Map ZIP prefixes / known ZIPs -> Craigslist subdomain
ZIP_TO_CITY: dict[str, str] = {
    # New York
    "100": "newyork", "101": "newyork", "102": "newyork", "103": "newyork",
    "104": "newyork", "110": "newyork", "111": "newyork", "112": "newyork",
    "113": "newyork", "114": "newyork", "115": "newyork",
    # Los Angeles
    "900": "losangeles", "901": "losangeles", "902": "losangeles", "903": "losangeles",
    "904": "losangeles", "905": "losangeles", "906": "losangeles", "907": "losangeles",
    "908": "losangeles", "910": "losangeles", "911": "losangeles", "912": "losangeles",
    "913": "losangeles", "914": "losangeles", "915": "losangeles", "916": "losangeles",
    # SF Bay Area
    "940": "sfbay", "941": "sfbay", "942": "sfbay", "943": "sfbay",
    "944": "sfbay", "945": "sfbay", "946": "sfbay", "947": "sfbay",
    "948": "sfbay", "949": "sfbay", "950": "sfbay", "951": "sfbay",
    "952": "sfbay", "953": "sfbay", "954": "sfbay", "955": "sfbay",
    # Chicago
    "606": "chicago", "607": "chicago", "608": "chicago",
    # Houston
    "770": "houston", "771": "houston", "772": "houston", "773": "houston",
    "774": "houston", "775": "houston", "776": "houston", "777": "houston",
    # Phoenix
    "850": "phoenix", "851": "phoenix", "852": "phoenix", "853": "phoenix",
    # Philadelphia
    "190": "philadelphia", "191": "philadelphia", "192": "philadelphia", "193": "philadelphia",
    # San Antonio
    "782": "sanantonio",
    # San Diego
    "919": "sandiego", "920": "sandiego", "921": "sandiego", "922": "sandiego",
    # Dallas
    "750": "dallas", "751": "dallas", "752": "dallas", "753": "dallas",
    # Seattle
    "980": "seattle", "981": "seattle", "982": "seattle", "983": "seattle",
    # Miami
    "330": "miami", "331": "miami", "332": "miami", "333": "miami", "334": "miami",
    # Boston
    "021": "boston", "022": "boston",
    # Denver
    "800": "denver", "801": "denver", "802": "denver", "803": "denver",
    # Atlanta
    "300": "atlanta", "301": "atlanta", "302": "atlanta", "303": "atlanta",
    # Portland
    "970": "portland", "971": "portland", "972": "portland",
    # Minneapolis
    "554": "minneapolis", "555": "minneapolis",
    # Austin
    "787": "austin", "786": "austin",
}
DEFAULT_CITY = "newyork"


def _zip_to_city(zip_code: str) -> str:
    if not zip_code:
        return DEFAULT_CITY
    for length in (5, 4, 3):
        prefix = zip_code[:length]
        if prefix in ZIP_TO_CITY:
            return ZIP_TO_CITY[prefix]
    return DEFAULT_CITY


def _extract_structured_results(soup: BeautifulSoup) -> list[dict]:
    payload_el = soup.select_one("#ld_searchpage_results")
    if not payload_el:
        return []

    try:
        payload = json.loads(payload_el.get_text(strip=True))
    except (TypeError, json.JSONDecodeError):
        return []

    items = payload.get("itemListElement", [])
    return items if isinstance(items, list) else []


async def search_craigslist(
    query: str,
    max_price: float = 0,
    zip_code: str = "",
) -> list[ListingCandidate]:
    """Scrape Craigslist for-sale listings."""
    city = _zip_to_city(zip_code)
    params: dict[str, str] = {"query": query, "sort": "date", "srchType": "T"}
    if max_price > 0:
        params["max_price"] = str(int(max_price))

    url = f"https://{city}.craigslist.org/search/sss"

    async with httpx.AsyncClient(
        timeout=12,
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    ) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        html = resp.text

    soup = BeautifulSoup(html, "html.parser")
    structured_items = _extract_structured_results(soup)
    cards = soup.select("li.cl-static-search-result")
    results: list[ListingCandidate] = []

    for index, card in enumerate(cards[:20]):
        try:
            title_el = card.select_one(".title")
            price_el = card.select_one(".price")
            link_el = card.select_one("a[href]")
            location_el = card.select_one(".location")
            if not title_el or not price_el or not link_el:
                continue

            title = title_el.get_text(strip=True)
            price_text = re.sub(r"[^\d.]", "", price_el.get_text(strip=True))
            if not title or not price_text:
                continue

            price = float(price_text)
            if price <= 0:
                continue

            item_url = str(link_el["href"]).strip()
            if not item_url:
                continue

            item_id_match = re.search(r"/(\d+)\.html", item_url)
            item_id = item_id_match.group(1) if item_id_match else f"craigslist-{index}"
            location = location_el.get_text(strip=True) if location_el else city

            image_urls: list[str] = []
            lat = None
            lng = None
            structured_item = structured_items[index].get("item", {}) if index < len(structured_items) else {}
            if isinstance(structured_item, dict):
                images = structured_item.get("image", [])
                if isinstance(images, list):
                    image_urls = [
                        str(image_url)
                        for image_url in images
                        if isinstance(image_url, str) and image_url.startswith("http")
                    ]

                offers = structured_item.get("offers", {})
                if isinstance(offers, dict):
                    place = offers.get("availableAtOrFrom", {})
                    if isinstance(place, dict):
                        address = place.get("address", {})
                        if isinstance(address, dict) and not location:
                            location = str(address.get("addressLocality", "")).strip() or city

                        geo = place.get("geo", {})
                        if isinstance(geo, dict):
                            try:
                                lat = float(geo.get("latitude")) if geo.get("latitude") is not None else None
                                lng = float(geo.get("longitude")) if geo.get("longitude") is not None else None
                            except (TypeError, ValueError):
                                lat = None
                                lng = None
            
            # Fallback to HTML if JSON-LD parsing missed the images
            if not image_urls:
                img_el = card.select_one("img")
                if img_el and img_el.has_attr("src"):
                    src = img_el["src"]
                    if src.startswith("http"):
                        image_urls.append(src)

            results.append(
                ListingCandidate(
                    source="craigslist",
                    source_item_id=item_id,
                    url=item_url,
                    title=title,
                    price=price,
                    condition="good",
                    image_urls=image_urls,
                    description="",
                    seller_name="",
                    seller_rating=0.0,
                    location_text=location,
                    lat=lat,
                    lng=lng,
                    is_local_pickup=True,
                    is_shipped=False,
                )
            )
        except Exception:
            continue

    return results

"""Craigslist adapter — server-side HTML scrape, no JS needed."""

import re
import httpx
from bs4 import BeautifulSoup
from backend.models.schemas import ListingCandidate

# Map ZIP prefixes / known ZIPs → Craigslist subdomain
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
    # Try full 5-digit match first, then 3-digit prefix
    for length in (5, 4, 3):
        prefix = zip_code[:length]
        if prefix in ZIP_TO_CITY:
            return ZIP_TO_CITY[prefix]
    return DEFAULT_CITY


async def search_craigslist(
    query: str,
    max_price: float = 0,
    zip_code: str = "",
) -> list[ListingCandidate]:
    """Scrape Craigslist for-sale listings."""
    city = _zip_to_city(zip_code)
    params: dict = {"query": query, "sort": "date", "srchType": "T"}
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
    results = []

    for row in soup.select(".result-row")[:20]:
        try:
            title_el = row.select_one(".result-title")
            price_el = row.select_one(".result-price")
            hood_el = row.select_one(".result-hood")
            link_el = row.select_one("a.result-title")
            img_el = row.select_one("a.result-image")

            if not title_el or not price_el:
                continue

            title = title_el.get_text(strip=True)
            price_text = re.sub(r"[^\d.]", "", price_el.get_text(strip=True))
            if not price_text:
                continue
            price = float(price_text)
            if price <= 0:
                continue

            item_url = str(link_el["href"]) if link_el else ""
            location = hood_el.get_text(strip=True).strip("() ") if hood_el else city
            item_id = item_url.split("/")[-1].replace(".html", "") if item_url else ""

            # Extract Craigslist image thumbnail
            image_urls: list[str] = []
            if img_el and img_el.get("data-ids"):
                raw_ids = str(img_el["data-ids"]).split(",")
                if raw_ids:
                    first = raw_ids[0]
                    img_id = first.split(":")[-1] if ":" in first else first
                    image_urls = [f"https://images.craigslist.org/{img_id}_300x300.jpg"]

            results.append(ListingCandidate(
                source="craigslist",
                source_item_id=item_id,
                url=item_url,
                title=title,
                price=price,
                condition="good",   # Craigslist doesn't standardize condition
                image_urls=image_urls,
                description="",
                seller_name="",
                seller_rating=0.0,
                location_text=location,
                is_local_pickup=True,
                is_shipped=False,
            ))
        except Exception:
            continue

    return results

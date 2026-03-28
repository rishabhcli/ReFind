"""Mock marketplace search tools with realistic secondhand listings."""

import json
import random

try:
    import railtracks as rt
except ModuleNotFoundError:
    rt = None


def _function_node(func):
    return rt.function_node(func) if rt is not None else func

# ── Mock listing database ──────────────────────────────────────────

MOCK_LISTINGS = {
    "craigslist": [
        {"id": "cl-001", "title": "Vintage Mid-Century Sofa - Great Condition", "price": 175, "condition": "good", "location": "Brooklyn, NY", "seller_name": "Mike R.", "seller_rating": 4.2, "description": "Beautiful mid-century modern sofa in olive green. Minor wear on armrests. Pet-free, smoke-free home.", "source": "craigslist", "url": "https://craigslist.org/cl-001", "posted_date": "2026-03-25"},
        {"id": "cl-002", "title": "Trek Mountain Bike 29er", "price": 280, "condition": "like_new", "location": "Manhattan, NY", "seller_name": "Sarah K.", "seller_rating": 4.8, "description": "2024 Trek Marlin 5. Ridden maybe 10 times. Includes helmet and lock.", "source": "craigslist", "url": "https://craigslist.org/cl-002", "posted_date": "2026-03-26"},
        {"id": "cl-003", "title": "PS5 Digital Edition + 3 Games", "price": 320, "condition": "like_new", "location": "Queens, NY", "seller_name": "Jason L.", "seller_rating": 4.5, "description": "PS5 digital edition, barely used. Comes with Spider-Man 2, FC 25, and Elden Ring.", "source": "craigslist", "url": "https://craigslist.org/cl-003", "posted_date": "2026-03-24"},
        {"id": "cl-004", "title": "Technics SL-1200 Turntable", "price": 450, "condition": "good", "location": "Jersey City, NJ", "seller_name": "DJ Marcos", "seller_rating": 4.9, "description": "Classic Technics 1200 MK2. Fully functional, new stylus. Perfect for vinyl lovers.", "source": "craigslist", "url": "https://craigslist.org/cl-004", "posted_date": "2026-03-22"},
        {"id": "cl-005", "title": "IKEA Sectional Couch - Moving Sale", "price": 120, "condition": "fair", "location": "Hoboken, NJ", "seller_name": "Anna P.", "seller_rating": 3.8, "description": "IKEA Friheten sectional. Some stains on cushions but structurally solid. Must pick up by Saturday.", "source": "craigslist", "url": "https://craigslist.org/cl-005", "posted_date": "2026-03-27"},
        {"id": "cl-006", "title": "Herman Miller Aeron Chair Size B", "price": 380, "condition": "good", "location": "Stamford, CT", "seller_name": "Office Surplus Co.", "seller_rating": 4.6, "description": "Refurbished Aeron. All adjustments work. Lumbar support included. 90-day warranty.", "source": "craigslist", "url": "https://craigslist.org/cl-006", "posted_date": "2026-03-23"},
        {"id": "cl-007", "title": "Vintage Record Player Console", "price": 200, "condition": "fair", "location": "Astoria, NY", "seller_name": "Vinny T.", "seller_rating": 4.0, "description": "1970s Magnavox console record player. Plays 33 and 45 RPM. Cabinet has scratches but speakers work great.", "source": "craigslist", "url": "https://craigslist.org/cl-007", "posted_date": "2026-03-20"},
    ],
    "facebook": [
        {"id": "fb-001", "title": "Leather Couch Set - Like New!", "price": 350, "condition": "like_new", "location": "Park Slope, Brooklyn", "seller_name": "Jennifer M.", "seller_rating": 4.7, "description": "Genuine leather 3-seater + loveseat. Bought 6 months ago, moving overseas. Originally $1,800.", "source": "facebook", "url": "https://facebook.com/marketplace/fb-001", "posted_date": "2026-03-26"},
        {"id": "fb-002", "title": "Giant Escape 3 Hybrid Bike", "price": 190, "condition": "good", "location": "Williamsburg, Brooklyn", "seller_name": "Chris D.", "seller_rating": 4.3, "description": "2023 Giant Escape 3. Regular commuter bike. New tires last month. Some scratches on frame.", "source": "facebook", "url": "https://facebook.com/marketplace/fb-002", "posted_date": "2026-03-25"},
        {"id": "fb-003", "title": "PS5 Disc + Extra Controller", "price": 350, "condition": "good", "location": "Upper East Side, NY", "seller_name": "Tom B.", "seller_rating": 4.1, "description": "PS5 disc edition. Works perfectly. Includes two DualSense controllers (one black, one red).", "source": "facebook", "url": "https://facebook.com/marketplace/fb-003", "posted_date": "2026-03-27"},
        {"id": "fb-004", "title": "Audio-Technica AT-LP120 Turntable", "price": 180, "condition": "like_new", "location": "Greenpoint, Brooklyn", "seller_name": "Maya S.", "seller_rating": 4.9, "description": "AT-LP120XUSB in silver. Used maybe 20 times. Includes original box and all accessories.", "source": "facebook", "url": "https://facebook.com/marketplace/fb-004", "posted_date": "2026-03-24"},
        {"id": "fb-005", "title": "West Elm Mid-Century Sofa", "price": 425, "condition": "like_new", "location": "SoHo, NY", "seller_name": "Design District", "seller_rating": 4.8, "description": "West Elm Hamilton sofa in charcoal. 1 year old, barely sat on. Retails for $1,200.", "source": "facebook", "url": "https://facebook.com/marketplace/fb-005", "posted_date": "2026-03-26"},
        {"id": "fb-006", "title": "Kids Bike - 20 inch wheels", "price": 45, "condition": "fair", "location": "Bay Ridge, Brooklyn", "seller_name": "Parent Life", "seller_rating": 3.5, "description": "Huffy kids bike. Some rust on chain but rides fine. Good starter bike.", "source": "facebook", "url": "https://facebook.com/marketplace/fb-006", "posted_date": "2026-03-21"},
    ],
    "offerup": [
        {"id": "ou-001", "title": "Comfy Sectional - Must Go!", "price": 150, "condition": "good", "location": "Long Island City, NY", "seller_name": "MovingSale2026", "seller_rating": 4.4, "description": "Large L-shaped sectional in gray fabric. Very comfortable. Removable/washable covers.", "source": "offerup", "url": "https://offerup.com/ou-001", "posted_date": "2026-03-27"},
        {"id": "ou-002", "title": "Specialized Rockhopper 27.5", "price": 350, "condition": "like_new", "location": "White Plains, NY", "seller_name": "TrailBoss", "seller_rating": 4.6, "description": "2025 Specialized Rockhopper Comp. 3 rides on it. Too big for me. Size Large.", "source": "offerup", "url": "https://offerup.com/ou-002", "posted_date": "2026-03-26"},
        {"id": "ou-003", "title": "PS5 Slim Bundle", "price": 300, "condition": "like_new", "location": "Newark, NJ", "seller_name": "GameDeals_NJ", "seller_rating": 4.7, "description": "PS5 Slim disc edition. Includes 2 controllers, charging dock, and 5 games. Original receipt available.", "source": "offerup", "url": "https://offerup.com/ou-003", "posted_date": "2026-03-25"},
        {"id": "ou-004", "title": "Crosley Voyager Portable Turntable", "price": 55, "condition": "like_new", "location": "Bronx, NY", "seller_name": "VinylHead", "seller_rating": 4.2, "description": "Crosley Voyager in dune color. Bluetooth capable. Bought last month, got a better setup.", "source": "offerup", "url": "https://offerup.com/ou-004", "posted_date": "2026-03-26"},
        {"id": "ou-005", "title": "Standing Desk + Chair Combo", "price": 200, "condition": "good", "location": "Yonkers, NY", "seller_name": "WFH_Upgrades", "seller_rating": 4.3, "description": "FlexiSpot standing desk (48x30) + basic ergonomic chair. Both in good shape.", "source": "offerup", "url": "https://offerup.com/ou-005", "posted_date": "2026-03-24"},
    ],
}


def _filter_listings(
    source: str, query: str, location: str = "", max_price: float = 0
) -> list[dict]:
    """Filter mock listings by query match, location, and price."""
    listings = MOCK_LISTINGS.get(source, [])
    query_lower = query.lower()
    # Filter out common stop words to avoid overly broad matching
    stop_words = {"find", "me", "a", "the", "an", "used", "best", "good", "cheap",
                  "great", "looking", "for", "under", "near", "in", "on", "deals", "deal",
                  "i", "want", "need", "get", "some", "like", "new", "my"}
    keywords = [w for w in query_lower.split() if w.strip("$.,!?") not in stop_words and len(w) > 1]
    # Also strip $ prefixed prices
    keywords = [w for w in keywords if not w.startswith("$") and not w.isdigit()]

    results = []
    for listing in listings:
        # Must match at least one meaningful keyword in title or description
        text = f"{listing['title']} {listing['description']}".lower()
        if not keywords or not any(word in text for word in keywords):
            continue
        if max_price > 0 and listing["price"] > max_price:
            continue
        results.append(listing)
    return results


@_function_node
def search_craigslist(query: str, location: str = "", max_price: float = 0) -> str:
    """Search Craigslist for secondhand listings matching the query."""
    results = _filter_listings("craigslist", query, location, max_price)
    return json.dumps({"source": "craigslist", "count": len(results), "listings": results})


@_function_node
def search_facebook_marketplace(query: str, location: str = "", max_price: float = 0) -> str:
    """Search Facebook Marketplace for secondhand listings matching the query."""
    results = _filter_listings("facebook", query, location, max_price)
    return json.dumps({"source": "facebook", "count": len(results), "listings": results})


@_function_node
def search_offerup(query: str, location: str = "", max_price: float = 0) -> str:
    """Search OfferUp for secondhand listings matching the query."""
    results = _filter_listings("offerup", query, location, max_price)
    return json.dumps({"source": "offerup", "count": len(results), "listings": results})

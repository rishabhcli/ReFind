"""Price comparison and scoring tools."""

import json

try:
    import railtracks as rt
except ModuleNotFoundError:
    rt = None


def _function_node(func):
    return rt.function_node(func) if rt is not None else func


# Rough market price references for common items
MARKET_PRICES = {
    "couch": {"low": 100, "mid": 300, "high": 800},
    "sofa": {"low": 100, "mid": 300, "high": 800},
    "sectional": {"low": 150, "mid": 400, "high": 1000},
    "bike": {"low": 50, "mid": 250, "high": 600},
    "bicycle": {"low": 50, "mid": 250, "high": 600},
    "ps5": {"low": 250, "mid": 350, "high": 450},
    "playstation": {"low": 250, "mid": 350, "high": 450},
    "turntable": {"low": 40, "mid": 200, "high": 500},
    "record player": {"low": 40, "mid": 200, "high": 500},
    "chair": {"low": 30, "mid": 150, "high": 500},
    "desk": {"low": 50, "mid": 200, "high": 600},
}


@_function_node
def get_market_price(item: str) -> str:
    """Get typical market price ranges for a secondhand item."""
    item_lower = item.lower()
    for key, prices in MARKET_PRICES.items():
        if key in item_lower:
            return json.dumps({
                "item": item,
                "price_range": prices,
                "note": f"Typical secondhand {key}: ${prices['low']}-${prices['high']}, average ~${prices['mid']}",
            })
    return json.dumps({
        "item": item,
        "price_range": {"low": 0, "mid": 0, "high": 0},
        "note": "No reference pricing available for this item. Use general judgment.",
    })


@_function_node
def score_deal(
    listing_title: str,
    listing_price: float,
    listing_condition: str,
    seller_rating: float,
    max_budget: float,
) -> str:
    """Score a deal from 0-100 based on price, condition, and seller rating."""
    # Price score (40% weight) — how far below budget
    if max_budget > 0:
        price_ratio = listing_price / max_budget
        if price_ratio <= 0.5:
            price_score = 100
        elif price_ratio <= 0.8:
            price_score = 80
        elif price_ratio <= 1.0:
            price_score = 60
        else:
            price_score = max(0, 40 - int((price_ratio - 1.0) * 100))
    else:
        price_score = 50  # No budget specified

    # Condition score (25% weight)
    condition_scores = {
        "new": 100,
        "like_new": 90,
        "good": 70,
        "fair": 45,
        "poor": 20,
    }
    condition_score = condition_scores.get(listing_condition, 50)

    # Seller score (20% weight)
    seller_score = min(100, int(seller_rating * 20))

    # Proximity placeholder (15% weight) — assume local for mock
    proximity_score = 75

    overall = int(
        price_score * 0.40
        + condition_score * 0.25
        + seller_score * 0.20
        + proximity_score * 0.15
    )

    return json.dumps({
        "listing_title": listing_title,
        "overall_score": overall,
        "price_score": price_score,
        "condition_score": condition_score,
        "seller_score": seller_score,
        "proximity_score": proximity_score,
    })

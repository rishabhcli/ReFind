"""7-Dimension deal scoring with haversine distance and deduplication.

Scores each ListingCandidate on 7 weighted dimensions:
  1. Value Gap     (35%) — price vs median eBay sold listings
  2. Distance      (20%) — miles from user zip (haversine)
  3. Condition     (15%) — canonical condition grade
  4. Seller Rep    (10%) — normalized 0–100
  5. Freshness     (10%) — days since post
  6. Image Quality  (5%) — photo count heuristic
  7. Description    (5%) — length-based completeness
"""

import math
import logging
from datetime import datetime, timezone
from difflib import SequenceMatcher

from backend.models.schemas import ListingCandidate, CONDITION_ALIASES

logger = logging.getLogger(__name__)

_EARTH_RADIUS_MI = 3958.8

_CONDITION_SCORE = {"new": 100, "like_new": 100, "good": 75, "fair": 50, "poor": 25}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in miles between two lat/lng points."""
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2) ** 2
    return 2 * _EARTH_RADIUS_MI * math.asin(math.sqrt(a))


def normalize_condition(raw: str) -> str:
    """Map arbitrary condition strings to canonical values."""
    return CONDITION_ALIASES.get(raw.strip().lower().replace("_", " "), "good")


def deduplicate(listings: list[ListingCandidate]) -> list[ListingCandidate]:
    """Remove near-duplicates: title similarity > 85% AND price diff < 15%."""
    unique: list[ListingCandidate] = []
    for c in listings:
        is_dup = False
        for u in unique:
            sim = SequenceMatcher(None, c.title.lower(), u.title.lower()).ratio()
            if sim > 0.85 and u.price > 0 and abs(c.price - u.price) / u.price < 0.15:
                is_dup = True
                break
        if not is_dup:
            unique.append(c)
    return unique


def score_listing_7d(
    listing: ListingCandidate,
    median_sold_price: float = 0.0,
    fair_low: float = 0.0,
    fair_high: float = 0.0,
    user_lat: float | None = None,
    user_lng: float | None = None,
    radius_miles: int = 25,
    max_price: float = 0.0,
) -> ListingCandidate:
    """Compute 7-dimension deal score and fill all scoring fields in-place."""
    fair_mid = (fair_low + fair_high) / 2 if fair_high > 0 else 0.0
    ref_price = median_sold_price or fair_mid

    # 1. Value Gap (35%)
    if ref_price > 0:
        gap = (ref_price - listing.price) / ref_price
        value_gap = max(0.0, min(100.0, 50 + gap * 100))
        listing.value_gap_pct = round(gap, 4)
    else:
        value_gap = 50.0
        listing.value_gap_pct = 0.0

    # 2. Distance (20%)
    if user_lat and user_lng and listing.lat and listing.lng:
        dist = haversine(user_lat, user_lng, listing.lat, listing.lng)
        distance_score = max(0.0, 100.0 * (1 - dist / radius_miles)) if dist <= radius_miles else 0.0
    else:
        distance_score = 60.0  # unknown distance fallback

    # 3. Condition (15%)
    condition_score = float(_CONDITION_SCORE.get(listing.condition, 50))

    # 4. Seller Reputation (10%)
    seller_score = min(100.0, listing.seller_rating * 20.0) if listing.seller_rating > 0 else 60.0

    # 5. Freshness (10%)
    freshness = 50.0
    if listing.posted_at:
        try:
            posted = datetime.fromisoformat(listing.posted_at.replace("Z", "+00:00"))
            days_old = (datetime.now(timezone.utc) - posted).days
            freshness = max(0.0, 100.0 - (days_old / 30.0) * 100.0)
        except (ValueError, TypeError):
            pass

    # 6. Image Quality (5%)
    image_quality = min(100.0, len(listing.image_urls) * 20.0)

    # 7. Description Completeness (5%)
    desc_len = len(listing.description or "")
    description_score = min(100.0, desc_len / 2.0)

    # Weighted total
    deal_score = round(
        value_gap * 0.35
        + distance_score * 0.20
        + condition_score * 0.15
        + seller_score * 0.10
        + freshness * 0.10
        + image_quality * 0.05
        + description_score * 0.05,
        1,
    )

    # Store dimension scores
    listing.score_value_gap = round(value_gap, 1)
    listing.score_distance = round(distance_score, 1)
    listing.score_condition = round(condition_score, 1)
    listing.score_seller_rep = round(seller_score, 1)
    listing.score_freshness = round(freshness, 1)
    listing.score_image_quality = round(image_quality, 1)
    listing.score_description = round(description_score, 1)
    listing.deal_score = deal_score
    listing.fair_value_low = round(fair_low, 2)
    listing.fair_value_high = round(fair_high, 2)

    # Recommended offer: 10–20% below list price
    discount = 0.15 if deal_score > 60 else 0.10
    raw_offer = min(listing.price * (1 - discount), ref_price * 0.75) if ref_price > 0 else listing.price * 0.85
    listing.recommended_offer = round(raw_offer / 5) * 5

    return listing

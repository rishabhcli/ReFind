from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class Condition(str, Enum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


# Map arbitrary condition strings to canonical values
CONDITION_ALIASES: dict[str, str] = {
    "new": "new", "brand new": "new",
    "like new": "like_new", "like_new": "like_new", "excellent": "like_new",
    "good": "good", "very good": "good", "used": "good",
    "fair": "fair", "acceptable": "fair",
    "poor": "poor", "salvage": "poor", "for parts": "poor",
}


class ListingCandidate(BaseModel):
    """Unified listing shape — every adapter must return this."""
    source: str                          # "ebay" | "mercari" | "craigslist" | "offerup" | "facebook" | "goodwill" | "poshmark"
    source_item_id: str
    url: str
    title: str
    price: float
    currency: str = "USD"
    condition: str                       # "new" | "like_new" | "good" | "fair" | "poor"
    image_urls: list[str] = Field(default_factory=list)
    description: str = ""
    seller_name: str = ""
    seller_rating: float = 0.0          # 0–5
    seller_review_count: int = 0
    location_text: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    posted_at: str = ""                 # ISO datetime string
    is_local_pickup: bool = False
    is_shipped: bool = True
    # Filled by scorer:
    deal_score: float = 0.0             # 0–100
    fair_value_low: float = 0.0
    fair_value_high: float = 0.0
    recommended_offer: float = 0.0
    value_gap_pct: float = 0.0          # how far below fair value (positive = good deal)
    # 7-Dimension scoring breakdown
    score_value_gap: float = 0.0        # 35% weight
    score_distance: float = 0.0         # 20% weight
    score_condition: float = 0.0        # 15% weight
    score_seller_rep: float = 0.0       # 10% weight
    score_freshness: float = 0.0        # 10% weight
    score_image_quality: float = 0.0    # 5% weight
    score_description: float = 0.0      # 5% weight
    # Enrichment fields (Phase 4)
    full_description: str = ""
    condition_notes: str = ""
    seller_username: str = ""
    shipping_cost: Optional[float] = None
    pickup_available: Optional[bool] = None
    additional_images: list[str] = Field(default_factory=list)
    payment_notes: str = ""


class SearchConstraints(BaseModel):
    item: str = Field(description="What the user is looking for")
    max_price: Optional[float] = Field(None, description="Maximum budget")
    min_price: Optional[float] = Field(None, description="Minimum price")
    condition: Optional[str] = Field(None, description="Desired condition")
    location: Optional[str] = Field(None, description="Preferred location/area")
    zip_code: Optional[str] = Field(None, description="ZIP code for distance filtering")
    radius_miles: Optional[int] = Field(25, description="Search radius in miles")
    brand: Optional[str] = Field(None, description="Preferred brand/model")
    keywords: list[str] = Field(default_factory=list, description="Extra keywords")


class NegotiationStrategy(BaseModel):
    """LLM-generated negotiation plan for a listing."""
    listing_id: str
    seller_name: str
    opening_message: str
    recommended_offer: float
    walk_away_price: float
    tone: str = "friendly"  # friendly, firm, casual
    requires_approval: bool = True


class ContactDraft(BaseModel):
    listing_id: str
    seller_name: str
    message: str
    requires_approval: bool = True


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None
    user_id: Optional[str] = None


class NegotiateRequest(BaseModel):
    """Request body for /api/negotiate."""
    message: str = ""
    thread_id: Optional[str] = None
    user_id: Optional[str] = None
    listing_id: str = ""
    listing_url: str = ""
    source: str = ""
    action: str = "generate"  # "generate" | "send" | "check_reply"
    message_override: Optional[str] = None
    recommended_offer: float = 0.0
    walk_away_price: float = 0.0


class SSEEvent(BaseModel):
    type: str  # "text", "tool_call", "tool_result", "done"
    content: Optional[str] = None
    tool_name: Optional[str] = None
    tool_call_id: Optional[str] = None
    args: Optional[dict] = None
    result: Optional[dict] = None

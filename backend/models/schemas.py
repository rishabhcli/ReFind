from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class Condition(str, Enum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class ListingCandidate(BaseModel):
    """Unified listing shape — every adapter must return this."""
    source: str                          # "ebay" | "mercari" | "craigslist" | "offerup" | "facebook" | "goodwill"
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
    location_text: str = ""
    posted_at: str = ""                 # ISO datetime string
    is_local_pickup: bool = False
    is_shipped: bool = True
    # Filled by scorer:
    deal_score: float = 0.0             # 0–100
    fair_value_low: float = 0.0
    fair_value_high: float = 0.0
    recommended_offer: float = 0.0
    value_gap_pct: float = 0.0          # how far below fair value (positive = good deal)


class SearchConstraints(BaseModel):
    item: str = Field(description="What the user is looking for")
    max_price: Optional[float] = Field(None, description="Maximum budget")
    min_price: Optional[float] = Field(None, description="Minimum price")
    condition: Optional[str] = Field(None, description="Desired condition")
    location: Optional[str] = Field(None, description="Preferred location/area")
    zip_code: Optional[str] = Field(None, description="ZIP code for distance filtering")
    radius_miles: Optional[int] = Field(25, description="Search radius in miles")
    keywords: list[str] = Field(default_factory=list, description="Extra keywords")


class ContactDraft(BaseModel):
    listing_id: str
    seller_name: str
    message: str
    requires_approval: bool = True


class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None
    user_id: Optional[str] = None


class SSEEvent(BaseModel):
    type: str  # "text", "tool_call", "tool_result", "done"
    content: Optional[str] = None
    tool_name: Optional[str] = None
    tool_call_id: Optional[str] = None
    args: Optional[dict] = None
    result: Optional[dict] = None

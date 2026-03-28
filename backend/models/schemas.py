from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional


class Condition(str, Enum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class SearchConstraints(BaseModel):
    item: str = Field(description="What the user is looking for")
    max_price: Optional[float] = Field(None, description="Maximum budget")
    min_price: Optional[float] = Field(None, description="Minimum price")
    condition: Optional[Condition] = Field(None, description="Desired condition")
    location: Optional[str] = Field(None, description="Preferred location/area")
    radius_miles: Optional[int] = Field(25, description="Search radius in miles")
    keywords: list[str] = Field(default_factory=list, description="Extra keywords")


class Listing(BaseModel):
    id: str
    title: str
    price: float
    condition: Condition
    location: str
    seller_name: str
    seller_rating: float = Field(ge=0, le=5)
    description: str
    image_url: Optional[str] = None
    source: str  # "craigslist", "facebook", "offerup"
    url: str
    posted_date: str


class DealScore(BaseModel):
    listing_id: str
    title: str
    price: float
    overall_score: int = Field(ge=0, le=100)
    price_score: int = Field(ge=0, le=100)
    condition_score: int = Field(ge=0, le=100)
    proximity_score: int = Field(ge=0, le=100)
    seller_score: int = Field(ge=0, le=100)
    reasoning: str


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

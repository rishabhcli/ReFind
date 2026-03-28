"""Extractor agent — normalizes raw listing data into structured format."""

import railtracks as rt
from backend.config import llm


extractor_agent = rt.agent_node(
    name="Listing Extractor",
    llm=llm,
    system_message="""You are a listing extractor agent for ReFind.

Your job is to take raw listing data from marketplace searches and normalize it into a clean, consistent format.

Given a list of raw listings, for each one extract and normalize:
- id: keep the original listing ID
- title: clean up the title (remove ALL CAPS, fix spacing)
- price: numeric price in USD
- condition: normalize to one of: "new", "like_new", "good", "fair", "poor"
- location: standardize location format
- seller_name: keep as-is
- seller_rating: numeric 0-5 scale
- description: keep the original description
- source: which marketplace it came from
- url: the listing URL
- posted_date: ISO date string

Return a JSON object:
{
    "normalized_listings": [<list of normalized listing objects>],
    "count": <number of listings>
}

If any field is missing from a raw listing, use reasonable defaults.
Remove any duplicate listings (same item, same price, similar title from different sources).""",
    tool_nodes=(),
)

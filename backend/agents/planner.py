"""Planner agent — interprets user shopping goals and extracts search constraints."""

import json
import railtracks as rt
from backend.config import llm


@rt.function_node
def extract_constraints(user_message: str) -> str:
    """Extract structured search constraints from the user's natural language request.
    Returns JSON with: item, max_price, min_price, condition, location, keywords."""
    # This tool is called by the planner agent to structure the user's intent.
    # The LLM actually does the extraction; this is a passthrough that documents the schema.
    return json.dumps({
        "note": "Use the LLM to parse the user message and return structured constraints.",
        "user_message": user_message,
    })


planner_agent = rt.agent_node(
    name="Shopping Planner",
    llm=llm,
    system_message="""You are a shopping planner agent for ReFind, a secondhand marketplace assistant.

Your job is to understand what the user wants to buy and extract clear search constraints.

When the user describes what they want, respond with a JSON object containing:
- "item": the main item they're looking for (e.g., "couch", "bike", "PS5")
- "max_price": maximum budget as a number (null if not specified)
- "min_price": minimum price as a number (null if not specified)
- "condition": preferred condition - one of "new", "like_new", "good", "fair", "poor" (null if no preference)
- "location": preferred area (null if not specified)
- "keywords": list of additional keywords that would help narrow the search

Always respond ONLY with valid JSON. No extra text.

Examples:
User: "Find me a used couch under $200"
Response: {"item": "couch", "max_price": 200, "min_price": null, "condition": null, "location": null, "keywords": ["used", "couch", "sofa"]}

User: "Best deals on bikes near Brooklyn"
Response: {"item": "bike", "max_price": null, "min_price": null, "condition": null, "location": "Brooklyn", "keywords": ["bike", "bicycle", "cycling"]}

User: "Looking for a PS5 in good condition, budget $350"
Response: {"item": "PS5", "max_price": 350, "min_price": null, "condition": "good", "location": null, "keywords": ["PS5", "PlayStation 5", "playstation", "gaming"]}""",
    tool_nodes=(),
)

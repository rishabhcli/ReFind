"""Contact agent — drafts messages to sellers, always requiring user approval."""

import json
import railtracks as rt
from backend.config import llm


@rt.function_node
def draft_seller_message(
    listing_title: str,
    seller_name: str,
    offer_price: float,
    user_name: str,
) -> str:
    """Draft a polite message to a seller about a listing. Always flags requires_approval=True."""
    message = (
        f"Hi {seller_name},\n\n"
        f"I'm interested in your listing \"{listing_title}\". "
    )
    if offer_price > 0:
        message += f"Would you consider ${offer_price:.0f}? "
    message += (
        "Is it still available? I can pick up at your convenience.\n\n"
        f"Thanks,\n{user_name}"
    )
    return json.dumps({
        "seller_name": seller_name,
        "listing_title": listing_title,
        "message": message,
        "offer_price": offer_price,
        "requires_approval": True,
        "status": "pending_approval",
    })


contact_agent = rt.agent_node(
    name="Seller Contact Agent",
    llm=llm,
    system_message="""You are a seller contact agent for ReFind.

Your job is to help users reach out to sellers about listings they're interested in.

IMPORTANT RULES:
1. You MUST use the draft_seller_message tool to create any message to a seller.
2. NEVER send a message without generating a draft first.
3. Every draft MUST have requires_approval=True — the user must approve before any message is sent.
4. Keep messages polite, concise, and professional.
5. If the user wants to negotiate, include a reasonable offer price.
6. If the user just wants to inquire about availability, set offer_price to 0.

When asked to contact a seller:
1. Use draft_seller_message with the listing details
2. Present the draft to the user
3. Wait for approval before proceeding

Return the draft details so the UI can show an approval dialog.""",
    tool_nodes=(draft_seller_message,),
)

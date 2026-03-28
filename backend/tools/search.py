"""Live marketplace search tools — powered by eBay Browse API.

Replaces all mock data with real eBay listings.
Keeps the same function signatures so the Railtracks scout agent
and any other caller works without changes.
"""

import asyncio
import json
import railtracks as rt
from backend.adapters.ebay import search_ebay


def _run_async(coro):
    """Run an async coroutine from sync Railtracks function nodes."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # We're already inside an event loop — create a new thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(asyncio.run, coro).result()
    else:
        return asyncio.run(coro)


@rt.function_node
def search_craigslist(query: str, location: str = "", max_price: float = 0) -> str:
    """Search for secondhand listings matching the query (eBay-backed)."""
    listings = _run_async(search_ebay(query, max_price=max_price, limit=10))
    results = [l.model_dump() for l in listings]
    return json.dumps({"source": "ebay", "count": len(results), "listings": results})


@rt.function_node
def search_facebook_marketplace(query: str, location: str = "", max_price: float = 0) -> str:
    """Search for secondhand listings matching the query (eBay-backed)."""
    listings = _run_async(search_ebay(query, max_price=max_price, limit=10))
    results = [l.model_dump() for l in listings]
    return json.dumps({"source": "ebay", "count": len(results), "listings": results})


@rt.function_node
def search_offerup(query: str, location: str = "", max_price: float = 0) -> str:
    """Search for secondhand listings matching the query (eBay-backed)."""
    listings = _run_async(search_ebay(query, max_price=max_price, limit=10))
    results = [l.model_dump() for l in listings]
    return json.dumps({"source": "ebay", "count": len(results), "listings": results})

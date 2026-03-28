"""Live marketplace search tools — powered by real marketplace adapters.

Keeps the same function signatures so the Railtracks scout agent
and any other caller works without changes.
"""

import asyncio
import json
import railtracks as rt
from backend.adapters.craigslist import search_craigslist as _search_craigslist
from backend.adapters.facebook import search_facebook as _search_facebook
from backend.adapters.offerup import search_offerup as _search_offerup


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
    """Search Craigslist for secondhand listings matching the query."""
    listings = _run_async(_search_craigslist(query, max_price=max_price, zip_code=location))
    results = [l.model_dump() for l in listings]
    return json.dumps({"source": "craigslist", "count": len(results), "listings": results})


@rt.function_node
def search_facebook_marketplace(query: str, location: str = "", max_price: float = 0) -> str:
    """Search Facebook Marketplace for secondhand listings matching the query."""
    listings = _run_async(_search_facebook(query, max_price=max_price))
    results = [l.model_dump() for l in listings]
    return json.dumps({"source": "facebook", "count": len(results), "listings": results})


@rt.function_node
def search_offerup(query: str, location: str = "", max_price: float = 0) -> str:
    """Search OfferUp for secondhand listings matching the query."""
    listings = _run_async(_search_offerup(query, max_price=max_price))
    results = [l.model_dump() for l in listings]
    return json.dumps({"source": "offerup", "count": len(results), "listings": results})

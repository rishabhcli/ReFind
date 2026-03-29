import asyncio
from backend.adapters.craigslist import search_craigslist
from backend.adapters.goodwill import search_goodwill
from backend.adapters.facebook import search_facebook
from backend.adapters.offerup import search_offerup
from backend.adapters.mercari import search_mercari

async def main():
    print("Testing Craigslist...")
    c_res = await search_craigslist("laptop", 0, "10001")
    for r in c_res[:2]: print(f"  {r.title} - {r.image_urls}")

    print("Testing Goodwill...")
    g_res = await search_goodwill("laptop", 0)
    for r in g_res[:2]: print(f"  {r.title} - {r.image_urls}")

    print("Testing Facebook...")
    f_res = await search_facebook("laptop", 0)
    for r in f_res[:2]: print(f"  {r.title} - {r.image_urls}")

    print("Testing OfferUp...")
    o_res = await search_offerup("laptop", 0)
    for r in o_res[:2]: print(f"  {r.title} - {r.image_urls}")

    print("Testing Mercari...")
    m_res = await search_mercari("laptop", 0)
    for r in m_res[:2]: print(f"  {r.title} - {r.image_urls}")

if __name__ == "__main__":
    asyncio.run(main())

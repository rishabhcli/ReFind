#!/usr/bin/env python3
"""Standalone script — launch a visible browser, log into Facebook manually,
then save the storage state for the ReFind agent to reuse.

Usage:
    python -m backend.setup_fb_session
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

# Default output path (override with FB_SESSION_PATH env var)
DEFAULT_PATH = str(Path(__file__).parent / "fb_session.json")


async def main() -> None:
    output_path = os.getenv("FB_SESSION_PATH", DEFAULT_PATH)

    print("=" * 60)
    print("  ReFind — Facebook Session Setup")
    print("=" * 60)
    print()
    print("A browser window will open to facebook.com.")
    print("Please log in manually (including any 2FA prompts).")
    print()
    print(f"Session will be saved to: {output_path}")
    print()

    pw = await async_playwright().start()
    browser = await pw.chromium.launch(headless=False, slow_mo=50)
    context = await browser.new_context(
        viewport={"width": 1280, "height": 900},
    )
    page = await context.new_page()
    await page.goto("https://www.facebook.com/", wait_until="domcontentloaded")

    print("🔑 Waiting for you to log in...")
    print("   Press ENTER in this terminal when you are fully logged in.\n")

    # Wait for terminal Enter in a thread so the browser stays responsive
    await asyncio.get_event_loop().run_in_executor(None, input)

    # Save storage state (cookies + localStorage)
    storage = await context.storage_state()
    with open(output_path, "w") as f:
        json.dump(storage, f, indent=2)

    print(f"\n✅ Session saved to {output_path}")
    print("   You can now start the ReFind backend — it will load this session automatically.")

    await context.close()
    await browser.close()
    await pw.stop()


if __name__ == "__main__":
    asyncio.run(main())

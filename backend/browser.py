"""Singleton browser manager — persistent Chromium with NopeCHA + FB session."""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Optional

from playwright.async_api import BrowserContext, Page, async_playwright, Playwright

from backend.config import (
    BROWSER_HEADLESS,
    BROWSER_SLOW_MO,
    FB_SESSION_PATH,
    MAX_BROWSER_TABS,
    NOPECHA_API_KEY,
    NOPECHA_EXTENSION_PATH,
)

logger = logging.getLogger(__name__)

# ── Module-level singleton state ──────────────────────────────────
_playwright: Optional[Playwright] = None
_context: Optional[BrowserContext] = None
_tab_semaphore: Optional[asyncio.Semaphore] = None
_fb_session_loaded: bool = False


async def init_browser() -> BrowserContext:
    """Launch (or return) the singleton persistent Chromium context."""
    global _playwright, _context, _tab_semaphore, _fb_session_loaded

    if _context is not None:
        return _context

    _playwright = await async_playwright().start()

    # Build launch arguments
    launch_args = [
        "--disable-blink-features=AutomationControlled",
    ]

    # NopeCHA extension loading
    nopecha_dir = Path(NOPECHA_EXTENSION_PATH)
    if nopecha_dir.is_dir():
        launch_args.extend([
            f"--disable-extensions-except={nopecha_dir}",
            f"--load-extension={nopecha_dir}",
        ])
        logger.info("🧩 NopeCHA extension loaded from %s", nopecha_dir)
    else:
        logger.warning("⚠️  NopeCHA extension not found at %s — CAPTCHAs will not be auto-solved", nopecha_dir)

    user_data_dir = str(Path(__file__).parent / ".browser_data")

    _context = await _playwright.chromium.launch_persistent_context(
        user_data_dir=user_data_dir,
        headless=BROWSER_HEADLESS,
        slow_mo=BROWSER_SLOW_MO,
        args=launch_args,
        viewport={"width": 1280, "height": 900},
        ignore_https_errors=True,
    )

    _tab_semaphore = asyncio.Semaphore(MAX_BROWSER_TABS)

    # Inject NopeCHA API key if extension is loaded and key is set
    if nopecha_dir.is_dir() and NOPECHA_API_KEY:
        await _inject_nopecha_key(_context)

    # Load Facebook session if available
    fb_path = Path(FB_SESSION_PATH)
    if fb_path.is_file():
        try:
            with open(fb_path, "r") as f:
                storage = json.load(f)
            await _context.add_cookies(storage.get("cookies", []))
            _fb_session_loaded = True
            logger.info("🔑 Facebook session loaded from %s", fb_path)
        except Exception as exc:
            logger.warning("⚠️  Failed to load FB session: %s — Facebook Marketplace disabled", exc)
            _fb_session_loaded = False
    else:
        logger.warning("⚠️  FB session file not found at %s — Facebook Marketplace disabled", fb_path)
        _fb_session_loaded = False

    logger.info(
        "🌐 Browser started (headless=%s, slow_mo=%d, max_tabs=%d)",
        BROWSER_HEADLESS, BROWSER_SLOW_MO, MAX_BROWSER_TABS,
    )
    return _context


async def _inject_nopecha_key(ctx: BrowserContext) -> None:
    """Navigate to NopeCHA options and inject the API key."""
    try:
        page = await ctx.new_page()
        await page.goto("chrome-extension://npgnhlnhpphdlkfdnggbdpbhoopefaai/popup.html", timeout=5000)
        await page.evaluate(
            f"chrome.storage.local.set({{key: '{NOPECHA_API_KEY}'}})"
        )
        await page.close()
        logger.info("🔑 NopeCHA API key injected")
    except Exception as exc:
        logger.warning("⚠️  Could not inject NopeCHA key: %s", exc)


def is_fb_session_available() -> bool:
    """Check whether FB session was loaded successfully."""
    return _fb_session_loaded


async def acquire_page() -> Page:
    """Get a new page, respecting MAX_BROWSER_TABS semaphore."""
    if _tab_semaphore is None or _context is None:
        raise RuntimeError("Browser not initialized — call init_browser() first")
    await _tab_semaphore.acquire()
    return await _context.new_page()


async def release_page(page: Page) -> None:
    """Close a page and release the semaphore slot."""
    if _tab_semaphore is None:
        return
    try:
        await page.close()
    finally:
        _tab_semaphore.release()


async def shutdown_browser() -> None:
    """Gracefully close the browser and playwright."""
    global _playwright, _context, _tab_semaphore
    if _context is not None:
        await _context.close()
        _context = None
    if _playwright is not None:
        await _playwright.stop()
        _playwright = None
    _tab_semaphore = None
    logger.info("🌐 Browser shut down")

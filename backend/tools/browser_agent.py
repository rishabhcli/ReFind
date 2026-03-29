"""Shared browser-use helpers for browser-driven search and negotiation tasks."""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

from backend.config import (
    BROWSER_HEADLESS,
    BROWSER_SLOW_MO,
    DO_INFERENCE_API_KEY,
    DO_INFERENCE_BASE_URL,
    MODEL_NAME,
    NOPECHA_EXTENSION_PATH,
)

logger = logging.getLogger(__name__)

try:
    from browser_use import Agent
    from browser_use.browser.session import BrowserSession
    from langchain_openai import ChatOpenAI

    BROWSER_USE_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency path
    Agent = None
    BrowserSession = None
    ChatOpenAI = None
    BROWSER_USE_AVAILABLE = False


def browser_use_ready() -> bool:
    return bool(BROWSER_USE_AVAILABLE and DO_INFERENCE_API_KEY)


def _browser_args() -> list[str]:
    args = ["--disable-blink-features=AutomationControlled"]
    extension_path = Path(NOPECHA_EXTENSION_PATH)
    if extension_path.is_dir():
        args.extend(
            [
                f"--disable-extensions-except={extension_path}",
                f"--load-extension={extension_path}",
            ]
        )
    return args


def _make_llm() -> Any:
    if not browser_use_ready():
        raise RuntimeError("browser-use is not configured")
    return ChatOpenAI(
        model=MODEL_NAME,
        base_url=DO_INFERENCE_BASE_URL,
        api_key=DO_INFERENCE_API_KEY,
        temperature=0,
    )


async def run_browser_task(
    task: str,
    *,
    storage_state: str | dict[str, Any] | None = None,
    allowed_domains: list[str] | None = None,
    max_steps: int = 12,
) -> tuple[str | None, str | None]:
    """Run a browser-use task and return (raw_result, error)."""

    if not browser_use_ready():
        return None, "browser_use_unavailable"

    session = BrowserSession(
        headless=BROWSER_HEADLESS,
        args=_browser_args(),
        viewport={"width": 1280, "height": 900},
        wait_between_actions=max(BROWSER_SLOW_MO / 1000.0, 0.05),
        storage_state=storage_state,
        allowed_domains=allowed_domains,
        keep_alive=False,
    )

    try:
        agent = Agent(
            task=task,
            llm=_make_llm(),
            browser_session=session,
            max_actions_per_step=4,
            step_timeout=90,
            use_thinking=True,
            use_vision="auto",
        )
        history = await agent.run(max_steps=max_steps)
        raw_result = history.final_result() if hasattr(history, "final_result") else str(history)
        return raw_result, None
    except Exception as exc:  # pragma: no cover - browser path is environment-dependent
        logger.warning("browser-use task failed: %s", exc)
        return None, str(exc)
    finally:
        try:
            await session.stop()
        except Exception:
            pass


def extract_json_array(raw_text: str | None) -> list[dict[str, Any]]:
    if not raw_text:
        return []
    match = re.search(r"\[[\s\S]*\]", raw_text)
    if not match:
        return []
    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError:
        return []
    return parsed if isinstance(parsed, list) else []


def extract_json_object(raw_text: str | None) -> dict[str, Any]:
    if not raw_text:
        return {}
    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        return {}
    try:
        parsed = json.loads(match.group())
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}

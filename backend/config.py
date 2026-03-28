import os
from pathlib import Path
from dotenv import load_dotenv
import railtracks as rt

_backend_dir = Path(__file__).parent

# Load .env from the backend directory (next to this file)
load_dotenv(_backend_dir / ".env")

# ──── LLM Selection (priority: OpenAI → Gemini → DigitalOcean) ────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# DigitalOcean Inference (OpenAI-compatible)
_DO_KEY = os.getenv("DO_INFERENCE_API_KEY", "")
_DO_BASE = os.getenv("DO_INFERENCE_BASE_URL", "https://inference.do-ai.run/v1/")
_DO_MODEL = os.getenv("MODEL_NAME", "meta-llama/Meta-Llama-3.3-70B-Instruct")

# Resolved LLM key / base / model — pick first available provider
if OPENAI_API_KEY:
    DO_INFERENCE_API_KEY = OPENAI_API_KEY
    DO_INFERENCE_BASE_URL = "https://api.openai.com/v1/"
    MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o-mini")
elif _DO_KEY:
    DO_INFERENCE_API_KEY = _DO_KEY
    DO_INFERENCE_BASE_URL = _DO_BASE
    MODEL_NAME = _DO_MODEL
else:
    DO_INFERENCE_API_KEY = ""
    DO_INFERENCE_BASE_URL = _DO_BASE
    MODEL_NAME = _DO_MODEL

# Create the LLM instance using OpenAI-compatible provider
llm = rt.llm.OpenAICompatibleProvider(
    model_name=MODEL_NAME,
    api_base=DO_INFERENCE_BASE_URL,
    api_key=DO_INFERENCE_API_KEY,
) if DO_INFERENCE_API_KEY else None

# ── eBay API ──────────────────────────────────────────────────────
EBAY_CLIENT_ID = os.getenv("EBAY_CLIENT_ID", "")
EBAY_CLIENT_SECRET = os.getenv("EBAY_CLIENT_SECRET", "")
EBAY_MARKETPLACE = os.getenv("EBAY_MARKETPLACE", "EBAY_US")

# SerpAPI (Google Shopping — for retail fair value)
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

# ── Browser & Extension Config ────────────────────────────────────
NOPECHA_API_KEY = os.getenv("NOPECHA_API_KEY", "")
NOPECHA_EXTENSION_PATH = os.getenv(
    "NOPECHA_EXTENSION_PATH",
    str(_backend_dir / "extensions" / "nopecha"),
)
FB_SESSION_PATH = os.getenv("FB_SESSION_PATH", str(_backend_dir / "fb_session.json"))
BROWSER_HEADLESS = os.getenv("BROWSER_HEADLESS", "false").lower() in ("true", "1", "yes")
BROWSER_SLOW_MO = int(os.getenv("BROWSER_SLOW_MO", "50"))
MAX_BROWSER_TABS = int(os.getenv("MAX_BROWSER_TABS", "4"))

# Server config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

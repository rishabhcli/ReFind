import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the backend directory
_backend_dir = Path(__file__).parent
load_dotenv(_backend_dir / ".env")

# ──── LLM Selection (priority: Gemini → OpenAI → DigitalOcean) ────

GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DO_INFERENCE_API_KEY = os.getenv("DO_INFERENCE_API_KEY", "")
DO_INFERENCE_BASE_URL = os.getenv("DO_INFERENCE_BASE_URL", "https://inference.do-ai.run/v1/")

llm = None

if DO_INFERENCE_API_KEY or GOOGLE_AI_API_KEY or OPENAI_API_KEY:
    try:
        import railtracks as rt
    except ModuleNotFoundError:
        print("⚠️  railtracks is not installed — running in MOCK MODE")
    else:
        if DO_INFERENCE_API_KEY:
            MODEL_NAME = os.getenv("MODEL_NAME", "meta-llama/Meta-Llama-3.3-70B-Instruct")
            print(f"🧠 Using DigitalOcean Inference ({MODEL_NAME})")
            llm = rt.llm.OpenAICompatibleProvider(
                model_name=MODEL_NAME,
                api_base=DO_INFERENCE_BASE_URL,
                api_key=DO_INFERENCE_API_KEY,
            )
        elif GOOGLE_AI_API_KEY:
            print(f"🧠 Using Gemini ({GEMINI_MODEL})")
            llm = rt.llm.GeminiLLM(
                model_name=GEMINI_MODEL,
                api_key=GOOGLE_AI_API_KEY,
            )
        elif OPENAI_API_KEY:
            print("🧠 Using OpenAI (gpt-4o-mini)")
            llm = rt.llm.OpenAILLM(
                model_name="gpt-4o-mini",
                api_key=OPENAI_API_KEY,
            )
else:
    print("⚠️  No LLM API key found — running in MOCK MODE")

# Server config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

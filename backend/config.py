import os
from pathlib import Path
from dotenv import load_dotenv
import railtracks as rt

# Load .env from the backend directory (next to this file)
load_dotenv(Path(__file__).parent / ".env")

# DigitalOcean Inference (OpenAI-compatible)
DO_INFERENCE_API_KEY = os.getenv("DO_INFERENCE_API_KEY", "")
DO_INFERENCE_BASE_URL = os.getenv(
    "DO_INFERENCE_BASE_URL", "https://inference.do-ai.run/v1/"
)
MODEL_NAME = os.getenv("MODEL_NAME", "meta-llama/Meta-Llama-3.3-70B-Instruct")

# Create the LLM instance using OpenAI-compatible provider
llm = rt.llm.OpenAICompatibleProvider(
    model_name=MODEL_NAME,
    api_base=DO_INFERENCE_BASE_URL,
    api_key=DO_INFERENCE_API_KEY,
)

# SerpAPI (Google Shopping — for retail fair value)
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

# Server config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

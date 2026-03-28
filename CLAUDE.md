# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is ReFind

ReFind is an AI-powered secondhand shopping assistant. Users describe what they want to buy, and the agent searches across Craigslist, Facebook Marketplace, and OfferUp, scores deals, and can draft seller messages (with user approval). It has a Next.js 16 frontend and a Python FastAPI backend orchestrated via the Railtracks agent framework.

## Architecture

**Two-service architecture** connected via SSE streaming:

```
Browser → Next.js frontend (port 3000) → /api/chat proxy route → Python backend (port 8000) → /api/agent/chat
```

- **Frontend** (`frontend/`): Next.js 16 App Router with `@assistant-ui/react` for the chat UI. Uses `useExternalStoreRuntime` (in `lib/runtime.ts`) to manage SSE streaming from the backend. Thread/message history is stored in browser localStorage (`lib/thread-storage.ts`).
- **Backend** (`backend/`): FastAPI app using Railtracks (`railtracks` package) for agent orchestration. A single orchestrator agent (`main.py`) has all tools attached. SSE events are streamed via `sse-starlette`.
- **Auth**: WorkOS AuthKit (`@workos-inc/authkit-nextjs`). Gracefully skipped in dev when `WORKOS_CLIENT_ID` is not set — all routes pass through and a hardcoded `"dev-user"` is used.
- **Proxy** (`frontend/proxy.ts`): Next.js 16 proxy (replaces middleware.ts). Conditionally applies WorkOS auth middleware.

**Backend agent structure** (Railtracks):
- `agents/planner.py` — Extracts structured search constraints from natural language
- `agents/scout.py` — Searches all three marketplaces via tools
- `agents/ranker.py` — Scores/ranks deals using `get_market_price` and `score_deal` tools
- `agents/extractor.py` — Normalizes raw listing data
- `agents/contact.py` — Drafts seller messages (always requires user approval)

Note: Currently `main.py` uses a single flat orchestrator with all tools rather than the multi-agent pipeline. The individual agent files exist but are not wired into the flow.

**Mock mode**: When `DO_INFERENCE_API_KEY` is empty, the backend runs in mock mode — tools execute against hardcoded listing data in `tools/search.py` without calling an LLM.

## Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev       # Next.js dev server on :3000
npm run build     # Production build
npm run lint      # ESLint
```

### Backend
```bash
pip install -r backend/requirements.txt
python -m backend.main    # Uvicorn dev server on :8000 with reload
```

### Docker (both services)
```bash
docker-compose up         # Starts frontend (:3000) and backend (:8000)
```

## Environment Variables

### Backend (`backend/.env`)
- `DO_INFERENCE_API_KEY` — DigitalOcean Inference API key (empty = mock mode)
- `DO_INFERENCE_BASE_URL` — OpenAI-compatible endpoint (default: `https://inference.do-ai.run/v1/`)
- `MODEL_NAME` — LLM model (default: `meta-llama/Meta-Llama-3.3-70B-Instruct`)
- `FRONTEND_URL` — CORS origin (default: `http://localhost:3000`)

### Frontend (`frontend/.env`)
- `NEXT_PUBLIC_AGENT_API_URL` — Backend URL (default: `http://localhost:8000`)
- `WORKOS_CLIENT_ID`, `WORKOS_API_KEY` — Optional; auth is skipped if not set

## Key Patterns

- **SSE protocol**: Backend streams JSON events with types `tool_call`, `tool_result`, `text`, and `done`. The `[DONE]` sentinel terminates the stream. Frontend parses these in `lib/runtime.ts`.
- **Tool UIs**: `@assistant-ui/react`'s `makeAssistantToolUI` renders custom cards for search progress, deal scores, and contact drafts. Registered in `components/chat/ToolUIs.tsx`.
- **Rate limiting**: In-memory per-user rate limit (20 req/min) in the Next.js `/api/chat` route handler. Resets on deploy.
- **Audit logging**: `lib/audit.ts` prepares WorkOS Audit Log events. Currently logs to console; sends to WorkOS API if `WORKOS_API_KEY` is configured.
- **Railtracks tools**: Decorated with `@rt.function_node`. Agents created with `rt.agent_node`. The flow is created with `rt.Flow`.

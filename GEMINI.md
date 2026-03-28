# ReFind

## Project Overview

ReFind is an AI-powered secondhand shopping assistant. It uses an LLM orchestrator (powered by Railtracks) to help users find the best deals on secondhand items across multiple marketplaces like Craigslist, Facebook Marketplace, and OfferUp. 

The project is structured as a full-stack application with a Python backend and a React/Next.js frontend. It leverages Server-Sent Events (SSE) for real-time agent response streaming.

**Core Technologies:**
- **Backend:** Python, FastAPI, Railtracks (LLM Orchestrator), Uvicorn.
- **Frontend:** Next.js (App Router), React 19, TailwindCSS v4, `@assistant-ui/react` for the conversational interface, WorkOS AuthKit, and Unkey.
- **Infrastructure:** Docker and Docker Compose.

## Building and Running

### Using Docker (Recommended)
You can build and run both services together using Docker Compose:

```bash
docker-compose up --build
```
- Frontend will be available at: `http://localhost:3000`
- Backend API will be available at: `http://localhost:8000`

### Running Locally

**Backend:**
1. Navigate to the `backend/` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your environment variables (refer to `backend/.env.example`).
4. Start the server:
   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```

**Frontend:**
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Development Conventions

### Backend
- **Architecture:** Organized modularly into `agents/`, `models/`, and `tools/`.
- **Entry Point:** `backend/main.py` contains the FastAPI application definition, SSE streaming endpoint, and the Railtracks orchestrator agent setup.
- **Mock Mode:** A `MOCK_MODE` is implemented. If the `DO_INFERENCE_API_KEY` is not provided, the backend falls back to a simulated pipeline that runs the search/pricing tools and returns mock results without calling an actual LLM.

### Frontend
- **Routing:** Built using the Next.js App Router (`app/`).
- **Components:** Organized functionally inside `components/` (e.g., `chat/`, `landing/`, `layout/`).
- **Styling:** Tailwind CSS is used heavily.
- **Linting:** Use `npm run lint` or `eslint` to ensure code quality and consistency.

# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` contains the Next.js 16 App Router client. Use `app/` for routes and route handlers, `components/` for feature UI (`chat`, `landing`, `layout`), `lib/` for runtime helpers, and `public/` for static assets.
- `backend/` contains the FastAPI + Railtracks service. `main.py` starts the API, `agents/` holds agent logic, `tools/` contains search/pricing helpers, and `models/` defines Pydantic schemas.
- Root files are mostly orchestration. Do not commit generated `__pycache__/` content or local `.env` changes.

## Build, Test, and Development Commands
- `cd frontend && npm install` installs frontend dependencies.
- `cd frontend && npm run dev` starts the UI at `http://localhost:3000`.
- `cd frontend && npm run build` creates a production build; `cd frontend && npm run start` serves it.
- `cd frontend && npm run lint` runs ESLint with the Next.js and TypeScript rules.
- `python -m pip install -r backend/requirements.txt` installs backend dependencies.
- `python backend/main.py` runs the FastAPI server with Uvicorn reload on port `8000`.

## Coding Style & Naming Conventions
- Frontend code is TypeScript with 2-space indentation. Keep React component files in PascalCase such as `LandingPage.tsx`; keep App Router files in framework convention names like `page.tsx` and `layout.tsx`.
- Backend code is Python with 4-space indentation. Use `snake_case` for modules and functions, and PascalCase for Pydantic models and enums.
- Keep route handlers thin. Put reusable logic in `backend/agents/`, `backend/tools/`, or `frontend/lib/` instead of duplicating it in pages or endpoints.

## Testing Guidelines
- No automated test suite is checked in yet. Until one exists, `cd frontend && npm run lint` plus local smoke testing is the minimum bar.
- Verify `GET /health`, a full chat request, and affected landing/chat UI before opening a PR.
- When adding tests, prefer `backend/tests/test_*.py` for API logic and feature-local or `frontend/__tests__/` files such as `LandingPage.test.tsx` for UI.

## Commit & Pull Request Guidelines
- Current history uses short, capitalized summaries (`Initial commit`, `First version of complete system.`). Keep commits focused and use concise subjects such as `Add seller message scoring`.
- PRs should describe user-facing impact, list commands run, link the related issue, and include screenshots or API/SSE samples when behavior changes.

## Security & Configuration Tips
- Copy `backend/.env.example` to `backend/.env` for local setup. Keep secrets like `DO_INFERENCE_API_KEY` out of git.
- If you add configuration, update `backend/.env.example` and note required values in the PR description.

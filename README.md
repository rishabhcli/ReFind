# ReFind 🔍

ReFind is an AI-powered secondhand shopping assistant. It helps users find the best deals on secondhand items across multiple marketplaces like Craigslist, Facebook Marketplace, and OfferUp.

The project is structured as a full-stack application leveraging an LLM orchestrator (powered by Railtracks) to provide a conversational, real-time agent interface.

## Technologies
- **Backend:** Python, FastAPI, Railtracks (LLM Orchestrator), Uvicorn
- **Frontend:** Next.js (App Router), React 19, TailwindCSS v4, `@assistant-ui/react`

## Features
- **Multi-marketplace Search:** Simultaneously searches Craigslist, Facebook Marketplace, and OfferUp to find listings.
- **AI Orchestration:** Understands user requests, analyzes pricing context, and objectively scores deals based on condition and market value.
- **Real-time Streaming:** Uses Server-Sent Events (SSE) for a fast, responsive chat interface.
- **Mock Mode:** Can run without an LLM API key by automatically falling back to simulated search and pricing tools.

## Quickstart (Recommended)

The easiest way to get ReFind up and running is using Docker Compose.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) installed on your system.

### Running with Docker

1. Start the application using Docker Compose from the root directory:
   ```bash
   docker-compose up --build
   ```

2. Open your browser and navigate to the frontend:
   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend API:** [http://localhost:8000](http://localhost:8000)

---

## Running Locally (Without Docker)

If you prefer to run the services directly on your machine:

### Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up your environment variables (refer to `backend/.env.example`):
   ```bash
   cp .env.example .env
   ```
4. Start the backend server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at [http://localhost:3000](http://localhost:3000).

## Contributing
Contributions are welcome. Feel free to open issues or submit pull requests.

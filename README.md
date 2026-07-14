# Neural Console -  Agent

A lightweight, full-stack interface for a Langchain-powered AI agent. The
agent can search the web for current events and fetch live weather data,
and this project wraps it in a proper chat UI instead of a notebook cell —
so it's usable, demoable, and easy to extend.

Two pieces:

```
agent-ui-project/
├── backend/     FastAPI wrapper around your existing agent (agent_server.py)
└── frontend/    React + Vite + Tailwind + Framer Motion chat UI
```

Your original agent logic is untouched — `agent_server.py` just puts an HTTP
endpoint (`POST /api/chat`) in front of the same `create_agent` setup, tools,
and retry wrapper from your script.

## Preview

**Chat interface**

![Neural Console chat UI](img1.png)

**Agent responding with tool usage**

![Agent response with tool calls](img2.png)

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then fill in your real API keys
uvicorn agent_server:app --reload --port 8000
```

Check it's alive: open `http://localhost:8000/api/health` — should return `{"status":"ok"}`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## 3. Using it

Type a message and hit Enter (Shift+Enter for a new line). The center orb
pulses while the agent is reasoning, and any tools it used (web search,
weather lookup) show up as tags above the reply.

## Notes / things to adjust for production

- CORS in `agent_server.py` is wide open (`allow_origins=["*"]`) for local
  dev. Lock this down to your real frontend domain before deploying.
- The current `/api/chat` endpoint is request/response, not streaming. If
  you want token-by-token streaming later, LangGraph's `agent.stream(...)`
  can be wired into a Server-Sent Events or WebSocket route.
- Each request currently resends the full conversation history (stateless
  backend). Fine for a prototype; for production you'd likely persist
  sessions server-side (Redis/DB) instead.
- Put real API keys only in `.env` files — never commit them.

---

**Kaveesha Madhushan**
Computer Engineering, University of Peradeniya
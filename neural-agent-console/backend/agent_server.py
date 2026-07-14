"""
FastAPI wrapper around the existing LangChain + LangGraph agent.
------------------------------------------------------------------
This does NOT change your agent's logic. It takes the exact same
tools / llm / agent setup from your original script and exposes it
over HTTP so a React frontend can talk to it.

Run with:
    uvicorn agent_server:app --reload --port 8000
"""

import os
import time
import requests
from dotenv import load_dotenv

from google.genai.errors import ClientError

from langchain.tools import tool
from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_tavily import TavilySearch

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# =============================================================
# ENVIRONMENT SETUP
# =============================================================
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY")

print("Checking environment variables:\n")
for name, value in [
    ("GROQ_API_KEY", GROQ_API_KEY),
    ("TAVILY_API_KEY", TAVILY_API_KEY),
    ("GOOGLE_API_KEY", GOOGLE_API_KEY),
    ("OPEN_WEATHER_API_KEY", OPEN_WEATHER_API_KEY),
]:
    status = "loaded" if value else "MISSING"
    print(f"  {name}: {status}")
print()


# =============================================================
# TOOLS
# =============================================================
@tool
def get_weather(city: str) -> str:
    """
    Get the current weather for a given city using the OpenWeatherMap API.

    Args:
        city (str): The name of the city to get the weather for.
    """
    response = requests.get(
        "http://api.openweathermap.org/data/2.5/weather",
        params={
            "q": city,
            "appid": OPEN_WEATHER_API_KEY,
            "units": "metric",
        },
    )
    data = response.json()

    if data.get("cod") != 200:
        return f"Could not get weather for '{city}': {data.get('message', 'unknown error')}"

    description = data["weather"][0]["description"]
    temp = data["main"]["temp"]

    return f"The weather in {city} is {description} with a temperature of {temp}°C."


search_tool = TavilySearch(max_results=3)
tools = [search_tool, get_weather]
print("Tools ready:", [t.name for t in tools])


# =============================================================
# LLM + AGENT
# =============================================================
llm = ChatGoogleGenerativeAI(
    model="gemini-flash-latest",
    temperature=0,
)

agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt=(
        "You are a helpful, logical assistant. "
        "Always search the web for current events or real-time data."
    ),
)
print("Agent created")


# =============================================================
# RETRY WRAPPER (unchanged from your script)
# =============================================================
def invoke_with_retry(agent, payload, max_retries: int = 3, base_delay: int = 5):
    for attempt in range(1, max_retries + 1):
        try:
            return agent.invoke(payload)
        except ClientError as e:
            if "RESOURCE_EXHAUSTED" in str(e) and attempt < max_retries:
                wait = base_delay * attempt
                print(f"Quota hit, retrying in {wait}s... (attempt {attempt}/{max_retries})")
                time.sleep(wait)
            else:
                raise


def extract_final_text(response: dict) -> str:
    content = response["messages"][-1].content
    if isinstance(content, list):
        return "".join(
            block.get("text", "") for block in content if isinstance(block, dict)
        )
    return content


def extract_tool_calls(response: dict):
    """Pulls out which tools were used during the run, for UI display."""
    used = []
    for msg in response["messages"]:
        calls = getattr(msg, "tool_calls", None)
        if calls:
            for c in calls:
                used.append(c.get("name", "unknown_tool"))
    return used


# =============================================================
# FASTAPI APP
# =============================================================
app = FastAPI(title="Agent API")

# Dev-friendly CORS. Tighten origins before deploying publicly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    response: str
    tools_used: List[str]
    elapsed_seconds: float


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    messages = []
    if req.history:
        for m in req.history:
            messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": req.message})

    start_time = time.time()
    try:
        response = invoke_with_retry(agent, {"messages": messages})
    except ClientError as e:
        return ChatResponse(
            response=f"Request failed: {e}",
            tools_used=[],
            elapsed_seconds=time.time() - start_time,
        )

    elapsed = time.time() - start_time
    return ChatResponse(
        response=extract_final_text(response),
        tools_used=extract_tool_calls(response),
        elapsed_seconds=elapsed,
    )

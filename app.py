"""
E2E Single AI Agent System using LangChain + LangGraph
--------------------------------------------------------
An agent that can:
  1. Search the web for current events (via Tavily)
  2. Fetch live weather data (via OpenWeatherMap)

Built on `create_agent` (LangGraph-based), which replaces the older
`create_react_agent` + `AgentExecutor` + `hub.pull` pattern.
"""

import os
import time
import requests
from dotenv import load_dotenv

from google import genai
from google.genai.errors import ClientError

from langchain.tools import tool
from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI

# Maintained Tavily integration (replaces the deprecated
# langchain_community.tools.tavily_search.TavilySearchResults)
from langchain_tavily import TavilySearch


# =============================================================
# ENVIRONMENT SETUP
# =============================================================

# Load variables from .env in the current working directory.
# If your .env lives elsewhere, pass dotenv_path="../.env" etc.
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY")

# Sanity check — confirms every key loaded without printing the
# actual secret values. If anything shows MISSING, check that the
# variable name here matches the name in .env exactly.
print("Checking environment variables:\n")
for name, value in [
    ("GROQ_API_KEY", GROQ_API_KEY),
    ("TAVILY_API_KEY", TAVILY_API_KEY),
    ("GOOGLE_API_KEY", GOOGLE_API_KEY),
    ("OPEN_WEATHER_API_KEY", OPEN_WEATHER_API_KEY),
]:
    status = "✅ loaded" if value else "❌ MISSING"
    print(f"  {name}: {status}")
print()


# =============================================================
# (OPTIONAL) LIST AVAILABLE MODELS FOR THIS KEY
# =============================================================
# Useful for debugging "model not found" / permission errors —
# shows exactly which Gemini models your key can actually call.
# Comment this block out once you've confirmed your model works,
# it adds an extra network call every run.

# client = genai.Client(api_key=GOOGLE_API_KEY)
# print("Models available to your key:\n")
# for m in client.models.list():
#     print(" ", m.name)
# print()


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
            "units": "metric",  # Celsius instead of the API's default Kelvin
        },
    )
    data = response.json()

    # OpenWeatherMap returns cod != 200 on errors (bad city, bad key, etc.)
    # instead of raising an HTTP error, so check it explicitly.
    if data.get("cod") != 200:
        return f"Could not get weather for '{city}': {data.get('message', 'unknown error')}"

    description = data["weather"][0]["description"]
    temp = data["main"]["temp"]

    return f"The weather in {city} is {description} with a temperature of {temp}°C."


# Tavily web search tool — gives the agent access to current/real-time info
# that isn't in the model's training data.
search_tool = TavilySearch(max_results=3)

tools = [search_tool, get_weather]
print("✅ Tools ready:", [t.name for t in tools])


# =============================================================
# LLM
# =============================================================

# gemini-flash-latest is a rolling alias that always points to whichever
# Flash-tier model Google currently serves to new accounts — safer than
# pinning a dated snapshot (e.g. gemini-2.5-flash), which Google can and
# does retire for new users without notice.
#
# Swap to "gemini-2.5-flash-lite" or "gemini-flash-lite-latest" if you
# want faster/cheaper responses at the cost of some reasoning depth.
llm = ChatGoogleGenerativeAI(
    model="gemini-flash-latest",
    temperature=0,
)
print("✅ LLM initialized")


# =============================================================
# AGENT
# =============================================================

# create_agent (LangGraph-based) replaces the older
# create_react_agent + AgentExecutor + hub.pull combo. It still runs
# the same reason -> act -> observe loop internally, just packaged
# more simply.
agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt=(
        "You are a helpful, logical assistant. "
        "Always search the web for current events or real-time data."
    ),
)
print("✅ Agent created")


# =============================================================
# RETRY WRAPPER
# =============================================================

def invoke_with_retry(agent, payload, max_retries: int = 3, base_delay: int = 5):
    """
    Wraps agent.invoke with basic exponential backoff for transient
    rate-limit errors (RESOURCE_EXHAUSTED / 429).

    Note: this only helps with genuine, temporary rate limits.
    It will NOT fix hard failures like invalid API keys, deprecated
    models (NOT_FOUND), or permission errors — those need a code/config
    fix, not a retry.
    """
    for attempt in range(1, max_retries + 1):
        try:
            return agent.invoke(payload)
        except ClientError as e:
            if "RESOURCE_EXHAUSTED" in str(e) and attempt < max_retries:
                wait = base_delay * attempt
                print(f"⚠️ Quota hit, retrying in {wait}s... (attempt {attempt}/{max_retries})")
                time.sleep(wait)
            else:
                raise


def extract_final_text(response: dict) -> str:
    """
    Some Gemini models (esp. with 'thinking' enabled) return content as
    a list of blocks like [{'type': 'text', 'text': '...', 'extras': {...}}]
    instead of a plain string. This normalizes either shape into clean text.
    """
    content = response["messages"][-1].content

    if isinstance(content, list):
        return "".join(
            block.get("text", "") for block in content if isinstance(block, dict)
        )
    return content


# =============================================================
# RUN
# =============================================================

question = "Who is the current prime minister of Sri Lanka, and what is the current weather in Colombo?"

print(f"\n🤖 Asking: {question}\n")

start_time = time.time()

try:
    response = invoke_with_retry(
        agent,
        {"messages": [{"role": "user", "content": question}]},
    )

    elapsed = time.time() - start_time

    print("==================================")
    print("FINAL ANSWER:")
    print("==================================")
    print(extract_final_text(response))
    print(f"\n⏱️ Total time: {elapsed:.1f}s")

except ClientError as e:
    # This branch only triggers if retries are exhausted or the error
    # isn't RESOURCE_EXHAUSTED (e.g. permission/auth/model errors).
    print("❌ Request failed after retries.")
    print(f"→ Details: {e}")
    print("→ If this is RESOURCE_EXHAUSTED: check quotas at")
    print("   https://console.cloud.google.com/iam-admin/quotas")
    print("→ If this is NOT_FOUND: the model name may be deprecated,")
    print("   try 'gemini-flash-latest' or check available models above.")
    print("→ If this is UNAUTHENTICATED/PERMISSION_DENIED: check your")
    print("   API key type (plain key vs service-account-bound key)")
    print("   and that the Generative Language API is enabled.")
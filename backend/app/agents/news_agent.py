from google.adk.agents import Agent
from app.agents.tools import free_web_search
import os

# Get the appropriate model based on available API keys
def get_model():
    """Select model based on available API keys with fallback support."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    if gemini_key:
        return "gemini-3.1-flash-lite"
    elif openrouter_key:
        print("[INFO] GEMINI_API_KEY not found. Using OpenRouter fallback for news agent.")
        return "openrouter/free"
    else:
        print("[WARNING] No LLM API keys configured. Using default model for news agent.")
        return "gemini-3.1-flash-lite"

news_agent = Agent(
    name="news_agent",
    model=get_model(),
    description="News Agent specialized in searching, compiling, and summarizing all latest news for a specific stock ticker.",
    instruction="""You are a specialized financial news intelligence agent for KITTA Terminal.
    Your main job is to:
    1. Search for news related to the target stock symbol using the `free_web_search` tool.
    2. Extract all relevant announcements, news stories, earnings report releases, dividends, mergers, or general sector movements.
    3. Synthesize the findings into a high-density, bulleted summary, highlighting positive and negative news factors.
    4. Provide an overall news sentiment classification (Bullish, Bearish, or Neutral) and justify it.
    Be objective, factual, and mention dates and headlines where available. Do not invent news.
    """,
    tools=[free_web_search]
)

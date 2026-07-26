from google.adk.agents import Agent
from app.agents.tools import run_chart_analysis
import os

# Get the appropriate model based on available API keys
def get_model():
    """Select model based on available API keys with fallback support."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    if gemini_key:
        return "gemini-3.5-flash-lite"
    elif openrouter_key:
        print("[INFO] GEMINI_API_KEY not found. Using OpenRouter fallback for chart analyst.")
        return "openrouter/free"
    else:
        print("[WARNING] No LLM API keys configured. Using default model for chart analyst.")
        return "gemini-3.5-flash-lite"

chart_analyst_agent = Agent(
    name="chart_analyst",
    model=get_model(),
    description="Chart Analyst Agent specialized in running technical analysis, calculating indicators, and assessing charts.",
    instruction="""You are a specialized Chartered Technical Analyst (CMT) for KITTA Terminal.
    Your main job is to:
    1. Run the `run_chart_analysis` tool to scrape chart data, generate indicators, and plot the visualization for the target stock symbol.
    2. Analyze the returned technical metrics including Close Price, Price Change, 20/50 EMAs, RSI, MACD, and Bollinger Bands.
    3. Determine the market trend (Bullish, Bearish, or Neutral) and highlight key patterns (e.g., golden cross, oversold/overbought conditions, breakout of trendlines).
    4. Provide clear Support and Resistance levels based on the peaks and troughs.
    5. Formulate a technical recommendation (BUY, SELL, or HOLD) based purely on the technical matrix.
    Be quantitative, refer to the exact values returned by the tool, and explain the indicator signals.
    """,
    tools=[run_chart_analysis]
)

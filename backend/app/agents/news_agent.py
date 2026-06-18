from google.adk.agents import Agent
from app.agents.tools import search_stock_news

news_agent = Agent(
    name="news_agent",
    model="gemini-3.1-flash-lite",
    description="News Agent specialized in searching, compiling, and summarizing all latest news for a specific stock ticker.",
    instruction="""You are a specialized financial news intelligence agent for KITTA Terminal.
    Your main job is to:
    1. Search for news related to the target stock symbol using the `search_stock_news` tool.
    2. Extract all relevant announcements, news stories, earnings report releases, dividends, mergers, or general sector movements.
    3. Synthesize the findings into a high-density, bulleted summary, highlighting positive and negative news factors.
    4. Provide an overall news sentiment classification (Bullish, Bearish, or Neutral) and justify it.
    Be objective, factual, and mention dates and headlines where available. Do not invent news.
    """,
    tools=[search_stock_news]
)

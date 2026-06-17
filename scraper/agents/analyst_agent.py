from google.adk.agents import Agent
from agents.news_agent import news_agent
from agents.chart_analyst import chart_analyst_agent
from google.adk.runners import Runner

from google.adk.sessions import InMemorySessionService
from google.genai import types
import time

def get_news_summary(symbol: str) -> str:
    """Gets the latest news and sentiment summary for the given stock symbol."""
    app_name = "kitta_app_news"
    session_id = f"session_news_{symbol}_{int(time.time())}"
    session_service = InMemorySessionService()
    session_service.create_session_sync(app_name=app_name, user_id="user_kitta", session_id=session_id)
    runner = Runner(agent=news_agent, app_name=app_name, session_service=session_service)
    
    msg = types.Content(role='user', parts=[types.Part(text=f"Analyze news for {symbol}")])
    events = runner.run(user_id="user_kitta", session_id=session_id, new_message=msg)
    for event in events:
        if event.is_final_response() and event.content:
            return event.content.parts[0].text.strip()
    return "No news found."

def get_chart_analysis(symbol: str) -> str:
    """Runs technical analysis and indicator calculations for the given stock symbol."""
    app_name = "kitta_app_chart"
    session_id = f"session_chart_{symbol}_{int(time.time())}"
    session_service = InMemorySessionService()
    session_service.create_session_sync(app_name=app_name, user_id="user_kitta", session_id=session_id)
    runner = Runner(agent=chart_analyst_agent, app_name=app_name, session_service=session_service)
    
    msg = types.Content(role='user', parts=[types.Part(text=f"Analyze chart for {symbol}")])
    events = runner.run(user_id="user_kitta", session_id=session_id, new_message=msg)
    for event in events:
        if event.is_final_response() and event.content:
            return event.content.parts[0].text.strip()
    return "No chart analysis found."

analyst_agent = Agent(
    name="analyst_agent",
    model="gemini-3.1-flash-lite",
    description="Master Analyst Agent that compiles news and chart data from specialized agents to produce stock reports.",
    instruction="""You are KITTA (किट्टा), the master AI financial analyst for the Nepal Stock Exchange (NEPSE).
    Your task is to respond to the investor's query by generating a comprehensive, high-fidelity stock appraisal.
    To fulfill this task, you MUST collaborate with your team:
    1. Query the `get_news_summary` tool to fetch and summarize the latest news and sentiment for the target stock.
    2. Query the `get_chart_analysis` tool to run technical analysis, gather indicator values (RSI, MACD, EMAs), and analyze the visual chart.
    3. Synthesize these inputs with fundamental logic:
       - Weigh the technical indicators and support/resistance levels.
       - Balance it against the latest news headlines and sentiment.
       - Formulate a unified, clear final recommendation (BUY, HOLD, ACCUMULATE, or REDUCE).
    Provide a professional, analytical response in beautiful Markdown, citing the findings from your sub-agents clearly.
    """,
    tools=[get_news_summary, get_chart_analysis]
)

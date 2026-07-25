from google.adk.agents import Agent
from google.adk.tools.agent_tool import AgentTool
from app.agents.chart_analyst import chart_analyst_agent
import os

# Get the appropriate model based on available API keys
def get_model():
    """Select model based on available API keys with fallback support."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    if gemini_key:
        return "gemini-3.5-flash-lite"
    elif openrouter_key:
        print("[INFO] GEMINI_API_KEY not found. Using OpenRouter fallback.")
        # Note: Google ADK may not support OpenRouter directly
        # If this fails, you need to set GEMINI_API_KEY
        return "openrouter/free"
    else:
        raise ValueError(
            "No LLM API keys configured. Please set either GEMINI_API_KEY or OPENROUTER_API_KEY in your .env file.\n"
            "Get a free Gemini API key from: https://aistudio.google.com/apikey\n"
            "Or get a free OpenRouter API key from: https://openrouter.ai/settings/keys"
        )

chart_agent_tool = AgentTool(agent=chart_analyst_agent, skip_summarization=False)

analyst_agent = Agent(
    name="analyst_agent",
    model=get_model(),
    description="Master Analyst Agent that compiles news and chart data from specialized agents to produce stock reports.",
    instruction="""You are KITTA (किट्टा), the master AI financial analyst for the Nepal Stock Exchange (NEPSE).
    Your task is to respond to the investor's specific query by generating a comprehensive, high-fidelity stock appraisal.
    
    CRITICAL INSTRUCTION: Do NOT just provide a generic summary. You MUST directly and explicitly answer the user's specific question (e.g., "should I buy?", "what is the trend?") based on the gathered data.
    
    To fulfill this task, you MUST collaborate with your team:
    1. READ THE CONTEXT: Review the `LATEST NEWS DATA` and `QUANT METRICS` injected into your prompt.
    2. REQUIRED: You MUST ALWAYS call the `chart_analyst_agent` tool to run technical analysis and gather the chart narrative. Always forward the user's message regarding the stock to it.
    3. Synthesize these inputs with fundamental logic:
       - Weigh the technical indicators and support/resistance levels.
       - Balance it against the latest news headlines and quant metrics.
       - Directly answer the user's query and formulate a unified, clear final recommendation (BUY, HOLD, ACCUMULATE, or REDUCE).
    Provide a professional, analytical response in beautiful Markdown, citing the findings from your sub-agents clearly.
    """,
    tools=[chart_agent_tool]
)

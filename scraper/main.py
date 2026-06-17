import os
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from agents import run_analysis_workflow
from chart_generator import generate_technical_chart

app = FastAPI(title="KITTA AI Agent API", version="1.0.0")

# Enable CORS for frontend and Node API integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterrogateRequest(BaseModel):
    prompt: str
    symbol: str

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "FastAPI AI Agent Engine"}

@app.post("/api/interrogate")
def interrogate(payload: InterrogateRequest):
    try:
        symbol = payload.symbol.strip().upper()
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol cannot be empty.")
            
        # Ensure chart is generated beforehand so agents have access to data & chart path
        run_analysis_metadata = generate_technical_chart(symbol)
        
        # Run ADK multi-agent workflow
        response = run_analysis_workflow(symbol=symbol, prompt=payload.prompt)
        
        # Inject chart path and metrics into response
        response["chart_path"] = f"/api/chart/{symbol}"
        response["metrics"] = run_analysis_metadata
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Agent system error: {str(e)}")

@app.get("/api/chart/{symbol}")
def get_chart(symbol: str):
    symbol = symbol.strip().upper()
    chart_path = os.path.abspath(os.path.join("static", "charts", f"{symbol}_chart.png"))
    
    # If the chart doesn't exist, trigger generation
    if not os.path.exists(chart_path):
        res = generate_technical_chart(symbol)
        if res.get("status") == "error":
            raise HTTPException(status_code=404, detail=f"Chart not found for symbol {symbol}")
            
    return FileResponse(chart_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

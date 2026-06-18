from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

from app.models.requests import InterrogateRequest
from app.agents import run_analysis_workflow
from app.services.chart_engine import generate_technical_chart

router = APIRouter(tags=["ai_agent"])

@router.post("/api/interrogate")
async def interrogate(payload: InterrogateRequest):
    try:
        symbol = payload.symbol.strip().upper()
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol cannot be empty.")
            
        # Ensure chart is generated beforehand so agents have access to data & chart path
        run_analysis_metadata = generate_technical_chart(symbol, static_dir="app/static")
        
        # Run ADK multi-agent workflow
        response = run_analysis_workflow(symbol=symbol, prompt=payload.prompt)
        
        # Inject chart path and metrics into response
        response["chart_path"] = f"/api/chart/{symbol}"
        response["metrics"] = run_analysis_metadata
        
        return response
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(tb)
        raise HTTPException(status_code=500, detail=f"AI Agent system error: {str(e)}\nTraceback:\n{tb}")

@router.get("/api/chart/{symbol}")
def get_chart(symbol: str):
    symbol = symbol.strip().upper()
    chart_path = os.path.abspath(os.path.join("app", "static", "charts", f"{symbol}_chart.png"))
    
    # If the chart doesn't exist, trigger generation
    if not os.path.exists(chart_path):
        res = generate_technical_chart(symbol, static_dir="app/static")
        if res.get("status") == "error":
            raise HTTPException(status_code=404, detail=f"Chart not found for symbol {symbol}")
            
    return FileResponse(chart_path)

@router.get("/api/metrics/{symbol}")
def get_metrics(symbol: str):
    try:
        symbol = symbol.strip().upper()
        res = generate_technical_chart(symbol, static_dir="app/static")
        if res.get("status") == "error":
             raise HTTPException(status_code=404, detail=res.get("message", "Metrics not found"))
        return res
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(tb)
        raise HTTPException(status_code=500, detail=str(e))

import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from app.models.responses import QuantMetricsResponse
from app.services.chart_engine import fetch_chart_data, _generate_synthetic_data
from app.services.quant_engine import compute_advanced_metrics
import time

router = APIRouter(prefix="/api/quant", tags=["quant"])

@router.get("/{symbol}", response_model=QuantMetricsResponse)
def get_quant_metrics(symbol: str):
    symbol = symbol.strip().upper()
    static_dir = os.path.join(os.getcwd(), "app", "static", "charts")
    os.makedirs(static_dir, exist_ok=True)
    csv_path = os.path.join(static_dir, f"{symbol}_historical_data.csv")
    
    # 1-day Cache Check
    cache_valid = False
    if os.path.exists(csv_path):
        if time.time() - os.path.getmtime(csv_path) < 86400:
            cache_valid = True
            
    try:
        if cache_valid:
            df = pd.read_csv(csv_path)
        else:
            df = fetch_chart_data(symbol)
            if df.empty:
                raise HTTPException(status_code=404, detail="No data available")
            df.to_csv(csv_path, index=False)
            
        metrics = compute_advanced_metrics(df)
        if "error" in metrics:
            raise HTTPException(status_code=400, detail=metrics["error"])
            
        return QuantMetricsResponse(
            symbol=symbol,
            status="success",
            trend=metrics["trend"],
            historical_prices=metrics["historical_prices"],
            volatility=metrics["volatility"],
            microstructure=metrics["microstructure"],
            statistical=metrics["statistical"],
            volume=metrics["volume"]
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Quant engine error: {str(e)}")

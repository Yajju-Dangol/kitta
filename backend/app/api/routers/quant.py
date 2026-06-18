import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from app.models.responses import QuantMetricsResponse
from app.services.cache_service import get_or_fetch_stock_data
import json

router = APIRouter(prefix="/api/quant", tags=["quant"])

@router.get("/{symbol}", response_model=QuantMetricsResponse)
def get_quant_metrics(symbol: str):
    symbol = symbol.strip().upper()
    try:
        # Pull from the unified 24-hour cache
        cached_row = get_or_fetch_stock_data(symbol)
        
        # Parse the JSON string from the database
        q_data_str = cached_row.get("quant_metrics")
        if isinstance(q_data_str, str):
            metrics = json.loads(q_data_str)
        else:
            metrics = q_data_str

        return QuantMetricsResponse(
            symbol=symbol,
            status="success",
            trend=metrics.get("trend", {}),
            historical_prices=metrics.get("historical_prices", []),
            volatility=metrics.get("volatility", {}),
            microstructure=metrics.get("microstructure", {}),
            statistical=metrics.get("statistical", {}),
            volume=metrics.get("volume", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Quant engine error: {str(e)}")

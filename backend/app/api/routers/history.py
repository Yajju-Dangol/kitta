from fastapi import APIRouter, HTTPException
from app.parsers.history_parser import HistoryParser
from app.models.responses import HistoryResponse

router = APIRouter(prefix="/api/history", tags=["history"])
parser = HistoryParser(static_dir="app/static") # relative to backend root

@router.get("/{symbol}", response_model=HistoryResponse)
def get_historical_data(symbol: str):
    """
    Returns structured historical data for a given symbol parsed from CSVs.
    """
    try:
        data = parser.parse_historical_csv(symbol)
        return HistoryResponse(
            symbol=symbol.upper(),
            status="success",
            data=data
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

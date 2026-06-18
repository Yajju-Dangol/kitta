from fastapi import APIRouter, HTTPException
from app.parsers.nepse_parser import NepseParser
from app.models.responses import NepseMarketSummaryResponse, NepseTopGainersResponse

router = APIRouter(prefix="/api/nepse", tags=["nepse"])
parser = NepseParser()

@router.get("/summary", response_model=NepseMarketSummaryResponse)
def get_market_summary():
    """Returns the live market summary from NEPSE."""
    try:
        data = parser.get_live_market_summary()
        return NepseMarketSummaryResponse(status="success", data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gainers", response_model=NepseTopGainersResponse)
def get_top_gainers():
    """Returns the top gainers list from NEPSE."""
    try:
        data = parser.get_top_gainers()
        return NepseTopGainersResponse(status="success", data=data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/disclosures")
def get_disclosures():
    """Returns the latest company disclosures from NEPSE."""
    try:
        data = parser.get_company_disclosures()
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

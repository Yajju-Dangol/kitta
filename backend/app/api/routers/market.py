import time
from fastapi import APIRouter, HTTPException
from nepse_scraper import NepseScraper

router = APIRouter(prefix="/api/market", tags=["market"])

# Simple in-memory cache for tickers to avoid spamming the NEPSE API
# Cache expires every 180 seconds (3 minutes)
cache = {
    "data": [],
    "last_fetched": 0
}

@router.get("/tickers")
def get_tickers():
    current_time = time.time()
    
    # If cache is valid (less than 3 mins old), return it
    if cache["data"] and (current_time - cache["last_fetched"] < 180):
        return cache["data"]
        
    try:
        scraper = NepseScraper(verify_ssl=False)
        # Fetch top 10 gainers
        top_gainers = scraper.get_top_stocks('top_gainer')[:10]
        
        tickers = []
        for stock in top_gainers:
            symbol = stock.get("symbol", "N/A")
            ltp = stock.get("ltp", 0.0)
            pct_change = stock.get("percentageChange", 0.0)
            
            trend = "up" if pct_change >= 0 else "down"
            delta = f"+{pct_change}%" if pct_change >= 0 else f"{pct_change}%"
            
            tickers.append({
                "symbol": symbol,
                "value": f"{ltp:,.2f}",
                "delta": delta,
                "trend": trend
            })
            
        # Update cache
        cache["data"] = tickers
        cache["last_fetched"] = current_time
        
        return tickers
    except Exception as e:
        print(f"Error fetching tickers from NEPSE API: {e}")
        # Return fallback cache if available, or empty
        return cache["data"] if cache["data"] else []

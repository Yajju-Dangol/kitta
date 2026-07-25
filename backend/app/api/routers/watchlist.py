from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from app.db.supabase import supabase_db
from pydantic import BaseModel
import asyncio
from app.agents import stream_analysis_workflow
from app.services.cache_service import get_or_fetch_stock_data
import json

router = APIRouter(prefix="/api/watchlist")

class WatchlistItem(BaseModel):
    symbol: str

class WatchlistAddRequest(BaseModel):
    symbol: str

@router.post("/add")
async def add_watchlist_item(req: WatchlistAddRequest, background_tasks: BackgroundTasks):
    """
    Add a stock to the watchlist and ensure its data is cached.
    If the stock data doesn't exist, fetch it in the background.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    sym = req.symbol.strip().upper()
    
    try:
        # Check if symbol already exists in watchlist
        res = supabase_db.table("watchlist_items").select("*").eq("symbol", sym).execute()
        
        if len(res.data) == 0:
            # Add to watchlist (using default watchlist ID for MVP)
            supabase_db.table("watchlist_items").insert({
                "watchlist_id": "3abec7be-0a38-46f6-aacb-b7f0d6732ef7", 
                "symbol": sym
            }).execute()
        
        # Ensure stock data exists in cache
        # Check if data exists and is fresh
        cache_check = supabase_db.table("stock_cache").select("expires_at").eq("symbol", sym).execute()
        
        if not cache_check.data or len(cache_check.data) == 0:
            # No cache exists - fetch data in background
            background_tasks.add_task(fetch_stock_data_background, sym)
            return {"status": "success", "message": f"Added {sym} to watchlist. Data is being fetched."}
        else:
            # Check if cache is expired
            from datetime import datetime, timezone
            expires_at_str = cache_check.data[0].get("expires_at")
            if expires_at_str:
                try:
                    expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                    if datetime.now(timezone.utc) >= expires_at:
                        # Cache expired - refresh in background
                        background_tasks.add_task(fetch_stock_data_background, sym, force_refresh=True)
                        return {"status": "success", "message": f"Added {sym} to watchlist. Data is being refreshed."}
                except Exception as e:
                    print(f"Error parsing expires_at: {e}")
        
        return {"status": "success", "message": f"Added {sym} to watchlist."}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


def fetch_stock_data_background(symbol: str, force_refresh: bool = False):
    """
    Background task to fetch and cache stock data.
    """
    try:
        print(f"[WATCHLIST] Fetching data for {symbol}...")
        get_or_fetch_stock_data(symbol, force_refresh=force_refresh)
        print(f"[WATCHLIST] Successfully cached data for {symbol}")
    except Exception as e:
        print(f"[WATCHLIST] Failed to fetch data for {symbol}: {e}")
        import traceback
        traceback.print_exc()

@router.get("/")
async def get_watchlist():
    """
    Returns the enriched watchlist for the current user.
    For MVP, we just fetch all unique symbols from watchlist_items and enrich them.
    (Ideally, we'd accept a user_id from auth token).
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        # Get all watchlist items
        wl_res = supabase_db.table("watchlist_items").select("symbol").execute()
        symbols = list(set([item["symbol"] for item in wl_res.data]))
        
        if not symbols:
            return {"stocks": []}
            
        enriched_stocks = []
        for sym in symbols:
            # Enforce data generation via the centralized cache service
            row = get_or_fetch_stock_data(sym)
            
            if not row:
                continue

            # Base stock_data
            stock_data = {
                "symbol": sym,
                "name": row.get("company_name", sym),
                "price": row.get("latest_price", 0) or 0,
                "open": 0,
                "high52": 0,
                "low52": 0,
                "volume": "0",
                "sector": "Market",
                "eps": 0,
                "pe": 0,
                "rsi": 50,
                "nav": 0,
                "divYield": 0,
                "sentiment": 50,
                "sparkline": [],
                "aiTarget": "N/A",
                "aiRisk": "N/A",
                "relativeVolume": "N/A"
            }
            
            q_data = row.get("quant_metrics")
            if isinstance(q_data, str):
                try:
                    q_data = json.loads(q_data)
                except:
                    q_data = {}
            elif not q_data:
                q_data = {}
            
            # Map real data
            stock_data["open"] = q_data.get("latest_open", stock_data["price"]) or 0
            
            # Prefer top-level column, fallback to quant_metrics
            stock_data["pe"] = row.get("pe_ratio") or q_data.get("pe_ratio", 0) or 0
            stock_data["rsi"] = row.get("rsi") or q_data.get("rsi", 50.0)
            
            sparkline = row.get("sparkline") or q_data.get("sparkline", [])
            if sparkline:
                stock_data["sparkline"] = sparkline
            
            # Fetch real AI metrics if generated, otherwise keep N/A
            n_data = row.get("news_summary")
            if isinstance(n_data, str):
                try:
                    n_data = json.loads(n_data)
                except:
                    n_data = {}
            elif not n_data:
                n_data = {}
                
            stock_data["sentiment"] = n_data.get("sentiment_score", 50)
            
            # If we have real historical prices in quant_data, use them for sparkline
            hist_prices = q_data.get("historical_prices", [])
            if hist_prices:
                stock_data["sparkline"] = [p.get("close", 0) for p in hist_prices[-10:] if isinstance(p, dict)]
            
            vol_stats = q_data.get("volume", {})
            if vol_stats and isinstance(vol_stats, dict):
                stock_data["relativeVolume"] = f"{vol_stats.get('volume_trend', '1.0')}x Avg"
            
            risk = q_data.get("volatility", {}).get("risk_level", "Medium")
            stock_data["aiRisk"] = risk.capitalize() if risk else "N/A"
                
            target = q_data.get("trend", {}).get("trend", "Neutral")
            stock_data["aiTarget"] = target.capitalize() if target else "N/A"
            
            enriched_stocks.append(stock_data)
            
        return {"stocks": enriched_stocks}
    except Exception as e:
        print(f"Watchlist error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cron/auto-scrape")
async def auto_scrape_watchlists(background_tasks: BackgroundTasks):
    """
    Triggered by pg_cron or manual.
    Finds all unique symbols in watchlists, checks if they are missing or expired in stock_cache,
    and runs the scraper for them.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        # Get all unique symbols in watchlists
        wl_res = supabase_db.table("watchlist_items").select("symbol").execute()
        symbols = list(set([item["symbol"] for item in wl_res.data]))
        
        if not symbols:
            return {"status": "success", "message": "No symbols to scrape"}
            
        # For each symbol, we want to run the pipeline if it's missing or expired.
        # To keep it simple, we can run a background task that iterates them.
        def scrape_task(syms):
            import asyncio
            from app.services.chart_engine import generate_technical_chart
            from app.agents.tools import free_web_search
            import requests
            
            for sym in syms:
                # Check cache first to avoid hammering if already fresh
                c_res = supabase_db.table("stock_cache").select("expires_at").eq("symbol", sym).execute()
                # If we want to strictly follow the 24 hour rule, we check expires_at.
                # For now, let's just force update if called.
                
                print(f"[CRON] Scraping data for {sym}...")
                try:
                    from app.services.cache_service import get_or_fetch_stock_data
                    # get_or_fetch_stock_data already handles charting, quant, and news, and upserts to the DB!
                    get_or_fetch_stock_data(sym, force_refresh=True)
                    
                    print(f"[CRON] Successfully updated {sym}")
                except Exception as e:
                    print(f"[CRON] Failed to update {sym}: {e}")
                    
        background_tasks.add_task(scrape_task, symbols)
        return {"status": "success", "message": f"Started scraping for {len(symbols)} symbols"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

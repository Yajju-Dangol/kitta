from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Header
from app.db.supabase import supabase_db
from pydantic import BaseModel
from typing import Optional

import json
from app.services.cache_service import get_or_fetch_stock_data

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])

# Fallback watchlist UUID for anonymous / MVP usage (no auth)
DEFAULT_WATCHLIST_ID = "3abec7be-0a38-46f6-aacb-b7f0d6732ef7"


class WatchlistAddRequest(BaseModel):
    symbol: str


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

def _get_user_id(authorization: Optional[str]) -> Optional[str]:
    """
    Extract the Supabase user_id from a Bearer JWT token.
    Returns None when no valid token is provided (anonymous / MVP mode).
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        user_resp = supabase_db.auth.get_user(token)
        return user_resp.user.id if user_resp and user_resp.user else None
    except Exception:
        return None


def _get_or_create_watchlist(user_id: Optional[str]) -> str:
    """
    Return the watchlist UUID for the given user.
    - If user_id is None → return the shared default watchlist.
    - If user_id is given → look up existing watchlist, or create one and return its id.
    """
    if not user_id:
        return DEFAULT_WATCHLIST_ID

    # Look for an existing watchlist belonging to this user
    res = supabase_db.table("watchlists").select("id").eq("user_id", user_id).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]["id"]

    # Create a new personal watchlist
    new_wl = supabase_db.table("watchlists").insert({
        "user_id": user_id,
        "name": "My Watchlist"
    }).execute()

    if new_wl.data and len(new_wl.data) > 0:
        return new_wl.data[0]["id"]

    raise HTTPException(status_code=500, detail="Failed to create watchlist for user")


# ---------------------------------------------------------------------------
# Background data fetch
# ---------------------------------------------------------------------------

def fetch_stock_data_background(symbol: str, force_refresh: bool = False):
    """
    Background task to fetch and cache stock data via the shared cache_service.
    This runs the full pipeline: chart → quant → news → fundamentals → upsert DB.
    """
    try:
        print(f"[WATCHLIST BG] Fetching data for {symbol}...")
        get_or_fetch_stock_data(symbol, force_refresh=force_refresh)
        print(f"[WATCHLIST BG] Successfully cached data for {symbol}")
    except Exception as e:
        print(f"[WATCHLIST BG] Failed to fetch data for {symbol}: {e}")
        import traceback
        traceback.print_exc()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/")
async def get_watchlist(authorization: Optional[str] = Header(default=None)):
    """
    Returns the enriched watchlist for the current logged-in user.
    NON-BLOCKING: Only reads from stock_cache. Never triggers a live analysis fetch.
    Symbols with no cache yet are returned as 'pending' placeholders.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    user_id = _get_user_id(authorization)

    try:
        watchlist_id = _get_or_create_watchlist(user_id)

        # Fetch all symbols in this user's watchlist
        wl_res = supabase_db.table("watchlist_items") \
            .select("symbol") \
            .eq("watchlist_id", watchlist_id) \
            .execute()

        symbols = list({item["symbol"] for item in wl_res.data})

        if not symbols:
            return {"stocks": [], "has_pending": False}

        # Bulk-fetch cache rows in ONE query (non-blocking read only)
        cache_res = supabase_db.table("stock_cache") \
            .select("*") \
            .in_("symbol", symbols) \
            .execute()

        cache_map = {row["symbol"]: row for row in (cache_res.data or [])}

        enriched_stocks = []
        for sym in symbols:
            row = cache_map.get(sym)

            # No cache yet — return a lightweight pending placeholder
            if not row:
                enriched_stocks.append({
                    "symbol": sym,
                    "name": sym,
                    "price": 0,
                    "open": 0,
                    "high52": 0,
                    "low52": 0,
                    "volume": "—",
                    "sector": "—",
                    "eps": 0,
                    "pe": 0,
                    "rsi": 0,
                    "nav": 0,
                    "divYield": 0,
                    "sentiment": 50,
                    "sparkline": [],
                    "aiTarget": "Analyzing…",
                    "aiRisk": "Pending",
                    "relativeVolume": "—",
                    "status": "pending",
                })
                continue

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
                "relativeVolume": "N/A",
                "status": "ready",
            }

            # Parse quant_metrics
            q_data = row.get("quant_metrics")
            if isinstance(q_data, str):
                try:
                    q_data = json.loads(q_data)
                except Exception:
                    q_data = {}
            elif not q_data:
                q_data = {}

            stock_data["open"] = q_data.get("latest_open", stock_data["price"]) or 0
            stock_data["pe"] = row.get("pe_ratio") or q_data.get("pe_ratio", 0) or 0
            stock_data["rsi"] = row.get("rsi") or q_data.get("rsi", 50.0)

            sparkline = row.get("sparkline") or q_data.get("sparkline", [])
            if sparkline:
                stock_data["sparkline"] = sparkline

            hist_prices = q_data.get("historical_prices", [])
            if hist_prices:
                stock_data["sparkline"] = [
                    p.get("close", 0) for p in hist_prices[-10:]
                    if isinstance(p, dict)
                ]

            n_data = row.get("news_summary")
            if isinstance(n_data, str):
                try:
                    n_data = json.loads(n_data)
                except Exception:
                    n_data = {}
            elif not n_data:
                n_data = {}
            stock_data["sentiment"] = n_data.get("sentiment_score", 50)

            vol_stats = q_data.get("volume", {})
            if vol_stats and isinstance(vol_stats, dict):
                stock_data["relativeVolume"] = f"{vol_stats.get('volume_trend', '1.0')}x Avg"

            risk = q_data.get("volatility", {}).get("risk_level", "Medium")
            stock_data["aiRisk"] = risk.capitalize() if risk else "N/A"

            target = q_data.get("trend", {}).get("trend", "Neutral")
            stock_data["aiTarget"] = target.capitalize() if target else "N/A"

            enriched_stocks.append(stock_data)

        has_pending = any(s.get("status") == "pending" for s in enriched_stocks)
        return {"stocks": enriched_stocks, "has_pending": has_pending}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add")
async def add_watchlist_item(
    req: WatchlistAddRequest,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(default=None)
):
    """
    Add a stock to the logged-in user's watchlist.
    - If the stock already has data in stock_cache, adds instantly.
    - If no data exists, triggers a background analysis (chart + quant + news)
      using the shared cache_service pipeline, then adds the item.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    user_id = _get_user_id(authorization)
    sym = req.symbol.strip().upper()

    try:
        watchlist_id = _get_or_create_watchlist(user_id)

        # Check if already in watchlist
        existing = supabase_db.table("watchlist_items") \
            .select("id") \
            .eq("watchlist_id", watchlist_id) \
            .eq("symbol", sym) \
            .execute()

        if not existing.data:
            supabase_db.table("watchlist_items").insert({
                "watchlist_id": watchlist_id,
                "symbol": sym
            }).execute()

        # Check stock_cache
        cache_check = supabase_db.table("stock_cache") \
            .select("symbol, expires_at") \
            .eq("symbol", sym) \
            .execute()

        if not cache_check.data:
            # No data at all → run full analysis in background
            background_tasks.add_task(fetch_stock_data_background, sym)
            return {
                "status": "success",
                "message": f"Added {sym} to your watchlist. Fetching stock analysis in the background…"
            }

        # Data exists → check freshness
        from datetime import datetime, timezone
        expires_str = cache_check.data[0].get("expires_at")
        if expires_str:
            try:
                expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) >= expires_at:
                    # Stale cache → refresh in background
                    background_tasks.add_task(fetch_stock_data_background, sym, force_refresh=True)
                    return {
                        "status": "success",
                        "message": f"Added {sym} to your watchlist. Refreshing stale data in the background…"
                    }
            except Exception:
                pass

        return {"status": "success", "message": f"Added {sym} to your watchlist."}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error adding to watchlist: {str(e)}")


@router.delete("/remove/{symbol}")
async def remove_watchlist_item(
    symbol: str,
    authorization: Optional[str] = Header(default=None)
):
    """
    Remove a stock from the logged-in user's watchlist.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    user_id = _get_user_id(authorization)
    sym = symbol.strip().upper()

    try:
        watchlist_id = _get_or_create_watchlist(user_id)

        supabase_db.table("watchlist_items") \
            .delete() \
            .eq("watchlist_id", watchlist_id) \
            .eq("symbol", sym) \
            .execute()

        return {"status": "success", "message": f"Removed {sym} from your watchlist"}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error removing from watchlist: {str(e)}")


@router.post("/cron/auto-scrape")
async def auto_scrape_watchlists(background_tasks: BackgroundTasks):
    """
    Triggered by pg_cron or manually.
    Finds all unique symbols across all watchlists, checks if they are missing
    or expired in stock_cache, and re-runs the scraper for them.
    """
    if not supabase_db:
        raise HTTPException(status_code=500, detail="Database not connected")

    try:
        wl_res = supabase_db.table("watchlist_items").select("symbol").execute()
        symbols = list({item["symbol"] for item in wl_res.data})

        if not symbols:
            return {"status": "success", "message": "No symbols to scrape"}

        def scrape_task(syms: list[str]):
            for sym in syms:
                print(f"[CRON] Scraping data for {sym}...")
                try:
                    get_or_fetch_stock_data(sym, force_refresh=True)
                    print(f"[CRON] Successfully updated {sym}")
                except Exception as e:
                    print(f"[CRON] Failed to update {sym}: {e}")

        background_tasks.add_task(scrape_task, symbols)
        return {"status": "success", "message": f"Started scraping for {len(symbols)} symbols"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.db.supabase import supabase_db
from datetime import datetime, timedelta, timezone
from app.services.chart_engine import generate_technical_chart, fetch_chart_data
from app.services.quant_engine import compute_advanced_metrics
from app.agents.tools import free_web_search
import json
import logging

logger = logging.getLogger(__name__)

def get_or_fetch_stock_data(symbol: str, force_refresh: bool = False):
    """
    Centralized caching service for KITTA.
    Ensures all pages (Quant, Watchlist, AI) share the same 24-hour cache.
    """
    symbol = symbol.strip().upper()
    
    if not supabase_db:
        # Fallback to direct computation if no DB connected
        return _force_fetch_data(symbol)
        
    try:
        if not force_refresh:
            res = supabase_db.table("stock_cache").select("*").eq("symbol", symbol).execute()
            
            if res.data and len(res.data) > 0:
                row = res.data[0]
                expires_at_str = row.get("expires_at")
                if expires_at_str:
                    try:
                        # Handle Postgres timestamp format
                        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                        if datetime.now(timezone.utc) < expires_at:
                            logger.info(f"[CACHE HIT] Fresh data found for {symbol}")
                            return row
                    except Exception as e:
                        logger.warning(f"Failed to parse expires_at for {symbol}: {e}")
        
        # If we reach here, it's missing or expired or forced
        logger.info(f"[CACHE MISS/EXPIRED] Fetching fresh data for {symbol}...")
        return _force_fetch_data(symbol)
        
    except Exception as e:
        logger.error(f"Cache service error for {symbol}: {str(e)}")
        # Try to return raw data as fallback
        return _force_fetch_data(symbol)

def _force_fetch_data(symbol: str):
    """
    Synchronous pipeline to fetch all core stock data.
    """
    try:
        # 1. Fetch Chart & Basic OHLCV
        logger.info(f"Generating chart for {symbol}")
        chart_res = generate_technical_chart(symbol, static_dir="app/static")
        chart_url = chart_res.get("supabase_url", "")
        latest_price = chart_res.get("latest_close", 0)
        
        # 2. Compute Quant Metrics
        logger.info(f"Computing quant metrics for {symbol}")
        df = fetch_chart_data(symbol)
        if df.empty:
            raise ValueError(f"No OHLCV data found for {symbol}")
        
        metrics = compute_advanced_metrics(df)
        if "error" in metrics:
            raise ValueError(metrics["error"])
        
        # 30 day sparkline
        sparkline = df['Close'].tail(30).tolist() if not df.empty else []

        # Convert to a flat JSON-serializable structure
        quant_dict = {
            "trend": metrics["trend"],
            "historical_prices": metrics.get("historical_prices", []),
            "volatility": metrics.get("volatility", {}),
            "microstructure": metrics.get("microstructure", {}),
            "statistical": metrics.get("statistical", {}),
            "volume": metrics.get("volume", {}),
            "pe_ratio": pe_ratio,
            "rsi": metrics["trend"].get("rsi", 50.0) if "trend" in metrics else 50.0,
            "sparkline": sparkline,
            "latest_open": float(df.iloc[-1]["Open"]) if not df.empty else latest_price
        }
        quant_json = json.dumps(quant_dict)
        
        # 3. Fetch News/Sentiment
        logger.info(f"Fetching news for {symbol}")
        news_data = free_web_search(f"{symbol} NEPSE stock news")
        
        # Attempt to structure news_summary if possible, but free_web_search returns a string
        # We will wrap it in JSON so it's consistent
        news_json = json.dumps({
            "raw_text": news_data,
            "sentiment_score": 50 # Default baseline
        })
        
        # 4. Fetch Fundamentals (PE Ratio)
        pe_ratio = 21.4 # Fallback
        try:
            logger.info(f"Fetching fundamentals for {symbol}")
            funda_data = free_web_search(f"{symbol} PE ratio sharesansar merolagani nepse")
            import re
            match = re.search(r'(?:PE|P/E)[\s\w]*?Ratio[\s:\-]*?([\d\.]+)', funda_data, re.IGNORECASE)
            if match:
                pe_ratio = float(match.group(1))
        except Exception as e:
            logger.warning(f"Could not fetch PE for {symbol}: {e}")
        
        # Assemble Final Row
        row = {
            "symbol": symbol,
            "company_name": f"{symbol}",
            "latest_price": latest_price,
            "quant_metrics": quant_json,
            "pe_ratio": pe_ratio,
            "rsi": float(metrics["trend"].get("rsi", 50.0)) if "trend" in metrics else 50.0,
            "sparkline": sparkline,
            "news_summary": news_json,
            "chart_storage_path": chart_url,
            # Let database set created_at and expires_at
        }
        
        # Upsert to DB if connected
        if supabase_db:
            try:
                # To trigger the 24 hour default properly, we let Postgres handle it,
                # but if we want to be explicit:
                now = datetime.now(timezone.utc)
                expires = now + timedelta(hours=24)
                
                row["created_at"] = now.isoformat()
                row["expires_at"] = expires.isoformat()
                
                supabase_db.table("stock_cache").upsert(row).execute()
                logger.info(f"[CACHE UPSERT] Successfully cached {symbol}")
            except Exception as db_e:
                logger.error(f"[CACHE UPSERT ERROR] Could not save to Supabase: {db_e}")
                
        return row
        
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        raise

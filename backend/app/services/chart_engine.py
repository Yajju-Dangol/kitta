import os
import time
import cloudscraper
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from datetime import datetime
from scipy.signal import find_peaks

def fetch_chart_data(symbol: str, resolution: str = "1D", start_date: str = "2023-01-01") -> pd.DataFrame:
    """
    Fetches historical chart data directly from NepseAlpha's trading API using cloudscraper.
    """
    symbol = symbol.strip().upper()
    dt_format = "%Y-%m-%d"
    try:
        start_ts = int(time.mktime(datetime.strptime(start_date, dt_format).timetuple()))
        end_ts = int(time.time())
    except ValueError:
        print("Date format error. Using default timestamps.")
        start_ts = int(time.time()) - (365 * 24 * 3600)
        end_ts = int(time.time())

    url = "https://nepsealpha.com/trading/1/history"
    params = {
        "symbol": symbol,
        "resolution": resolution,
        "from": start_ts,
        "to": end_ts,
        "currencyCode": "NRS"
    }
    
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'windows',
            'desktop': True
        }
    )
    
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://nepsealpha.com/nepse-chart",
        "Origin": "https://nepsealpha.com"
    }
    
    try:
        response = scraper.get(url, params=params, headers=headers, timeout=15)
        response.raise_for_status() 
        data = response.json()
        
        if data.get('s') != 'ok':
            print(f"API status not OK for {symbol}: {data.get('s')}")
            return _fallback_fetch_from_nepse(symbol)
            
        df = pd.DataFrame({
            'Timestamp': data['t'],
            'Open': data['o'],
            'High': data['h'],
            'Low': data['l'],
            'Close': data['c'],
            'Volume': data['v']
        })
        df['Date'] = pd.to_datetime(df['Timestamp'], unit='s')
        df = df[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']]
        df = df.sort_values('Date').reset_index(drop=True)
        return df
    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return _fallback_fetch_from_nepse(symbol)

def _fallback_fetch_from_nepse(symbol: str) -> pd.DataFrame:
    """Fallback generator to fetch real data from NEPSE API if NepseAlpha is blocked."""
    print(f"Falling back to NEPSE official API for {symbol}")
    try:
        from nepse_scraper import NepseScraper
        from datetime import datetime, timedelta
        
        scraper = NepseScraper(verify_ssl=False)
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        
        data = scraper.get_ticker_price_history(symbol, start_date, end_date, size=500)
        content = data.get('content', [])
        
        if not content:
            raise ValueError(f"No content in NEPSE fallback for {symbol}")
            
        df = pd.DataFrame([{
            'Date': item['businessDate'],
            'Open': item['openPrice'],
            'High': item['highPrice'],
            'Low': item['lowPrice'],
            'Close': item['closePrice'],
            'Volume': item['totalTradedQuantity']
        } for item in content])
        
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date').reset_index(drop=True)
        return df
    except Exception as fallback_e:
        print(f"Fallback to NEPSE failed for {symbol}: {fallback_e}")
        # Return empty dataframe instead of fake data so the system errors gracefully
        return pd.DataFrame()

def generate_technical_chart(symbol: str, static_dir: str = None) -> dict:
    """
    Scrapes stock history, runs technical indicator analysis,
    plots a multi-panel chart, and saves to static dir.
    """
    import re
    symbol = re.sub(r'[^A-Z0-9]', '', symbol.strip().upper())
    if static_dir is None:
        static_dir = os.path.join(os.getcwd(), "static", "charts")
        
    os.makedirs(static_dir, exist_ok=True)
    csv_path = os.path.join(static_dir, f"{symbol}_historical_data.csv")
    chart_path = os.path.join(static_dir, f"{symbol}_chart.png")
    
    cache_valid = False
    if os.path.exists(csv_path):
        if time.time() - os.path.getmtime(csv_path) < 86400:
            cache_valid = True
            
    if cache_valid:
        print(f"Using cached data for {symbol}")
        df = pd.read_csv(csv_path)
    else:
        df = fetch_chart_data(symbol)
        if not df.empty:
            df.to_csv(csv_path, index=False)
        
    if df.empty:
        return {"status": "error", "message": f"No data retrieved for symbol {symbol}"}
        
    # Calculate indicators
    df['EMA20'] = df['Close'].ewm(span=20, adjust=False).mean()
    df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
    
    # RSI
    delta = df['Close'].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    ema_gain = gain.ewm(com=13, adjust=False).mean()
    ema_loss = loss.ewm(com=13, adjust=False).mean()
    rs = ema_gain / ema_loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD
    df['EMA12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['EMA26'] = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = df['EMA12'] - df['EMA26']
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
    
    # Bollinger Bands
    df['BB_Middle'] = df['Close'].rolling(window=20).mean()
    df['BB_Std'] = df['Close'].rolling(window=20).std()
    df['BB_Upper'] = df['BB_Middle'] + (df['BB_Std'] * 2)
    df['BB_Lower'] = df['BB_Middle'] - (df['BB_Std'] * 2)
    
    # Wavelet Transform (db4 smoothed close)
    df['Wavelet_Smooth'] = (
        df['Close'] * 0.483 +
        df['Close'].shift(1) * 0.837 +
        df['Close'].shift(2) * 0.224 +
        df['Close'].shift(3) * -0.129
    ) / 1.415
    
    # Plotting window
    chart_df = df.tail(150).copy().reset_index(drop=True)
    dates = chart_df['Date']
    prices = chart_df['Close'].values
    x = np.arange(len(prices))
    
    # Find peaks/troughs safely
    peaks, _ = find_peaks(prices, distance=10, prominence=5)
    troughs, _ = find_peaks(-prices, distance=10, prominence=5)
    
    # Style the chart with a beautiful dark theme
    plt.style.use('dark_background')
    fig, axes = plt.subplots(4, 1, figsize=(14, 10), sharex=True, 
                             gridspec_kw={'height_ratios': [4, 1.2, 1.5, 1.5]})
    
    fig.patch.set_facecolor('#09090B')
    for ax in axes:
        ax.set_facecolor('#101014')
        ax.grid(True, color='#27272A', linestyle=':', alpha=0.5)
        ax.spines['bottom'].set_color('#27272A')
        ax.spines['top'].set_color('#27272A')
        ax.spines['left'].set_color('#27272A')
        ax.spines['right'].set_color('#27272A')
        ax.tick_params(colors='#A1A1AA', labelsize=9)
    
    # PANEL 1: Price and EMAs + Bollinger Bands
    ax0 = axes[0]
    ax0.plot(x, chart_df['Close'], label='Close Price', color='#60A5FA', linewidth=1.8)
    ax0.plot(x, chart_df['EMA20'], label='20 EMA', color='#F59E0B', linestyle='--', linewidth=1.2)
    ax0.plot(x, chart_df['EMA50'], label='50 EMA', color='#EC4899', linestyle='--', linewidth=1.2)
    ax0.plot(x, chart_df['Wavelet_Smooth'], label='Wavelet Trend (db4)', color='#C084FC', linewidth=2.5, zorder=4)
    
    if 'BB_Upper' in chart_df.columns:
        ax0.plot(x, chart_df['BB_Upper'], color='#3B82F6', alpha=0.3, label='Bollinger Upper')
        ax0.plot(x, chart_df['BB_Lower'], color='#3B82F6', alpha=0.3, label='Bollinger Lower')
        ax0.fill_between(x, chart_df['BB_Upper'], chart_df['BB_Lower'], color='#3B82F6', alpha=0.03)

    # Trendlines
    if len(peaks) >= 2:
        p1, p2 = peaks[-2], peaks[-1]
        m_res = (prices[p2] - prices[p1]) / (p2 - p1)
        c_res = prices[p1] - m_res * p1
        ax0.plot(x[p1:], m_res * x[p1:] + c_res, color='#EF4444', linestyle='-', linewidth=1.8, label='Resistance')
        ax0.scatter(peaks, prices[peaks], color='#EF4444', marker='^', s=45, label='Peaks', zorder=5)
        
    if len(troughs) >= 2:
        t1, t2 = troughs[-2], troughs[-1]
        m_sup = (prices[t2] - prices[t1]) / (t2 - t1)
        c_sup = prices[t1] - m_sup * t1
        ax0.plot(x[t1:], m_sup * x[t1:] + c_sup, color='#10B981', linestyle='-', linewidth=1.8, label='Support')
        ax0.scatter(troughs, prices[troughs], color='#10B981', marker='v', s=45, label='Troughs', zorder=5)
        
    ax0.set_title(f"{symbol} Real-Time Valuation Matrix", color='#F4F4F5', fontsize=13, fontweight='bold', pad=12)
    ax0.set_ylabel("Price (NPR)", color='#A1A1AA')
    ax0.legend(loc='upper left', framealpha=0.6, facecolor='#09090B', edgecolor='#27272A', fontsize=8)
    
    # PANEL 2: Volume
    ax1 = axes[1]
    volume_colors = ['#10B981' if chart_df['Close'][i] >= chart_df['Open'][i] else '#EF4444' for i in range(len(chart_df))]
    ax1.bar(x, chart_df['Volume'], color=volume_colors, width=0.8, alpha=0.8)
    ax1.set_ylabel("Volume", color='#A1A1AA')
    
    # PANEL 3: RSI
    ax2 = axes[2]
    ax2.plot(x, chart_df['RSI'], color='#8B5CF6', linewidth=1.5, label='RSI (14)')
    ax2.axhline(70, color='#EF4444', linestyle='--', linewidth=0.8)
    ax2.axhline(30, color='#10B981', linestyle='--', linewidth=0.8)
    ax2.fill_between(x, 70, 30, color='#8B5CF6', alpha=0.04)
    ax2.set_ylabel("RSI", color='#A1A1AA')
    ax2.set_ylim(10, 90)
    ax2.legend(loc='upper left', framealpha=0.6, facecolor='#09090B', edgecolor='#27272A', fontsize=8)
    
    # PANEL 4: MACD
    ax3 = axes[3]
    ax3.plot(x, chart_df['MACD'], color='#3B82F6', linewidth=1.2, label='MACD')
    ax3.plot(x, chart_df['MACD_Signal'], color='#F59E0B', linewidth=1.2, label='Signal')
    hist_colors = ['#10B981' if val >= 0 else '#EF4444' for val in chart_df['MACD_Hist']]
    ax3.bar(x, chart_df['MACD_Hist'], color=hist_colors, width=0.8, alpha=0.6, label='Hist')
    ax3.set_ylabel("MACD", color='#A1A1AA')
    ax3.legend(loc='upper left', framealpha=0.6, facecolor='#09090B', edgecolor='#27272A', fontsize=8)
    
    # Format X Axis
    label_step = max(1, len(chart_df) // 8)
    ax3.set_xticks(x[::label_step])
    ax3.set_xticklabels([str(d)[:10] for d in dates[::label_step]], rotation=25, ha='right')
    ax3.set_xlabel("Date", color='#A1A1AA')
    
    plt.tight_layout()
    chart_path = os.path.join(static_dir, f"{symbol}_chart.png")
    plt.savefig(chart_path, dpi=180, facecolor='#09090B')
    plt.close()
    
    supabase_url = None
    try:
        from app.db.supabase import supabase_db
        if supabase_db:
            with open(chart_path, 'rb') as f:
                res = supabase_db.storage.from_("scraped_charts").upload(
                    path=f"{symbol}_chart.png",
                    file=f,
                    file_options={"content-type": "image/png", "upsert": "true"}
                )
            supabase_url = supabase_db.storage.from_("scraped_charts").get_public_url(f"{symbol}_chart.png")
    except Exception as e:
        print(f"Failed to upload chart to Supabase: {e}")
    
    # Compute basic stats for agent reference
    latest = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else latest
    price_change = latest['Close'] - prev['Close']
    price_change_pct = (price_change / prev['Close']) * 100 if prev['Close'] > 0 else 0
    
    return {
        "status": "success",
        "csv_path": csv_path,
        "chart_path": chart_path,
        "supabase_url": supabase_url,
        "latest_close": latest['Close'],
        "price_change": price_change,
        "price_change_pct": price_change_pct,
        "latest_rsi": latest['RSI'],
        "latest_macd": latest['MACD'],
        "latest_macd_signal": latest['MACD_Signal'],
        "latest_ema20": latest['EMA20'],
        "latest_ema50": latest['EMA50'],
        "bb_upper": latest['BB_Upper'] if 'BB_Upper' in latest else None,
        "bb_lower": latest['BB_Lower'] if 'BB_Lower' in latest else None,
    }

if __name__ == "__main__":
    res = generate_technical_chart("NABIL")
    print(res)

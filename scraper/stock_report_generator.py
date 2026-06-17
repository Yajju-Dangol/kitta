"""
NEPSE Stock Report Generator
============================
A comprehensive stock analysis report generator for Nepal Stock Exchange.

Usage:
    python stock_report_generator.py

The script will prompt for a stock ticker symbol, then generate a single
self-contained HTML file with all available NEPSE data, technical indicators,
and interactive charts.
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.offline as pyo

from nepse_scraper import NepseScraper

# Disable SSL warnings
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


# =============================================================================
# Technical Indicators
# =============================================================================

def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index (RSI)."""
    delta = prices.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta).where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1/period, min_periods=period).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period).mean()

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calculate_macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """Calculate MACD, Signal, and Histogram."""
    ema_fast = prices.ewm(span=fast, adjust=False).mean()
    ema_slow = prices.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def calculate_bollinger_bands(prices: pd.Series, period: int = 20, std_dev: int = 2) -> Tuple[pd.Series, pd.Series, pd.Series]:
    """Calculate Bollinger Bands."""
    sma = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    return upper, sma, lower


def calculate_sma(prices: pd.Series, period: int) -> pd.Series:
    """Calculate Simple Moving Average."""
    return prices.rolling(window=period).mean()


def calculate_ema(prices: pd.Series, period: int) -> pd.Series:
    """Calculate Exponential Moving Average."""
    return prices.ewm(span=period, adjust=False).mean()


# =============================================================================
# Data Fetching
# =============================================================================

class NEPSEDataFetcher:
    def __init__(self):
        self.scraper = NepseScraper(verify_ssl=False)
        self.data = {}

    def fetch_all(self, ticker: str) -> Dict[str, Any]:
        """Fetch all available data for a given ticker."""
        ticker_upper = ticker.upper()
        logger.info(f"Fetching comprehensive data for: {ticker_upper}")

        # 1. Market Status
        try:
            self.data['market_open'] = self.scraper.is_market_open()
            logger.info(f"Market is open: {self.data['market_open']}")
        except Exception as e:
            logger.warning(f"Could not fetch market status: {e}")
            self.data['market_open'] = None

        # 2. Market Summary
        try:
            self.data['market_summary'] = self.scraper.get_market_summary()
        except Exception as e:
            logger.warning(f"Could not fetch market summary: {e}")
            self.data['market_summary'] = {}

        # 3. NEPSE Index
        try:
            self.data['nepse_index'] = self.scraper.get_nepse_index()
        except Exception as e:
            logger.warning(f"Could not fetch NEPSE index: {e}")
            self.data['nepse_index'] = []

        # 4. Ticker Info
        try:
            self.data['ticker_info'] = self.scraper.get_ticker_info(ticker_upper)
        except Exception as e:
            logger.warning(f"Could not fetch ticker info: {e}")
            self.data['ticker_info'] = {}

        # 5. Ticker Contact
        try:
            self.data['ticker_contact'] = self.scraper.get_ticker_contact(ticker_upper)
        except Exception as e:
            logger.warning(f"Could not fetch ticker contact: {e}")
            self.data['ticker_contact'] = {}

        # 6. Price History (last 180 days for good indicator calculation)
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=365)  # Get 1 year for better charts
            self.data['price_history'] = self.scraper.get_ticker_price_history(
                ticker=ticker_upper,
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d'),
                size=500
            )
        except Exception as e:
            logger.warning(f"Could not fetch price history: {e}")
            self.data['price_history'] = []

        # 7. Today's Price
        try:
            today_prices = self.scraper.get_today_price()
            self.data['today_data'] = next(
                (item for item in today_prices if item.get('symbol') == ticker_upper), None
            )
        except Exception as e:
            logger.warning(f"Could not fetch today's price: {e}")
            self.data['today_data'] = None

        # 8. Security Daily Trade Stats
        try:
            self.data['daily_trade_stat'] = self.scraper.get_security_daily_trade_stat(ticker_upper)
        except Exception as e:
            logger.warning(f"Could not fetch daily trade stats: {e}")
            self.data['daily_trade_stat'] = {}

        # 9. Company Disclosures
        try:
            disclosures = self.scraper.get_company_disclosures()
            # Filter disclosures for this company if possible
            self.data['disclosures'] = disclosures[:10]  # Latest 10
        except Exception as e:
            logger.warning(f"Could not fetch disclosures: {e}")
            self.data['disclosures'] = []

        # 10. Sector-wise Summary
        try:
            self.data['sector_summary'] = self.scraper.get_sectorwise_summary()
        except Exception as e:
            logger.warning(f"Could not fetch sector summary: {e}")
            self.data['sector_summary'] = []

        # 11. Top Stocks context
        try:
            self.data['top_gainers'] = self.scraper.get_top_stocks('top_gainer')
            self.data['top_losers'] = self.scraper.get_top_stocks('top_loser')
        except Exception as e:
            logger.warning(f"Could not fetch top stocks: {e}")
            self.data['top_gainers'] = []
            self.data['top_losers'] = []

        logger.info("Data fetching complete.")
        return self.data


# =============================================================================
# Data Processing
# =============================================================================

def process_price_history(price_history) -> pd.DataFrame:
    """Convert price history to a pandas DataFrame with indicators.

    Args:
        price_history: Either a list of dicts, or a dict with a 'content' key
                       (paginated NEPSE response).
    """
    # Handle paginated response
    if isinstance(price_history, dict):
        records = price_history.get('content', [])
    elif isinstance(price_history, list):
        records = price_history
    else:
        return pd.DataFrame()

    if not records:
        return pd.DataFrame()

    # Remove nested 'security' dict from each record if present
    clean_records = []
    for rec in records:
        clean = {k: v for k, v in rec.items() if k != 'security'}
        clean_records.append(clean)

    df = pd.DataFrame(clean_records)

    # Identify columns - NEPSE API returns various column names
    # Common fields: businessDate, closePrice, highPrice, lowPrice, openPrice, volume, totalTradedQuantity
    date_col = 'businessDate' if 'businessDate' in df.columns else 'date'
    close_col = 'closePrice' if 'closePrice' in df.columns else 'close'
    open_col = 'openPrice' if 'openPrice' in df.columns else 'open'
    high_col = 'highPrice' if 'highPrice' in df.columns else 'high'
    low_col = 'lowPrice' if 'lowPrice' in df.columns else 'low'
    volume_col = 'volume' if 'volume' in df.columns else 'totalTradedQuantity'

    if date_col not in df.columns:
        # Try to find date-like column
        for col in df.columns:
            if 'date' in col.lower():
                date_col = col
                break

    # Convert date
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.sort_values(by=date_col).reset_index(drop=True)

    # Ensure numeric columns
    numeric_cols = [close_col, open_col, high_col, low_col, volume_col]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Rename to standard names for easier processing
    column_map = {}
    if date_col != 'date': column_map[date_col] = 'date'
    if close_col != 'close': column_map[close_col] = 'close'
    if open_col != 'open': column_map[open_col] = 'open'
    if high_col != 'high': column_map[high_col] = 'high'
    if low_col != 'low': column_map[low_col] = 'low'
    if volume_col != 'volume': column_map[volume_col] = 'volume'

    if column_map:
        df = df.rename(columns=column_map)

    # Calculate indicators
    if 'close' in df.columns and len(df) >= 14:
        df['rsi'] = calculate_rsi(df['close'])
        df['sma_20'] = calculate_sma(df['close'], 20)
        df['sma_50'] = calculate_sma(df['close'], 50)
        df['ema_12'] = calculate_ema(df['close'], 12)
        df['ema_26'] = calculate_ema(df['close'], 26)

        macd, signal, hist = calculate_macd(df['close'])
        df['macd'] = macd
        df['macd_signal'] = signal
        df['macd_histogram'] = hist

        bb_upper, bb_middle, bb_lower = calculate_bollinger_bands(df['close'])
        df['bb_upper'] = bb_upper
        df['bb_middle'] = bb_middle
        df['bb_lower'] = bb_lower

        # Daily returns and volatility
        df['daily_return'] = df['close'].pct_change() * 100
        df['volatility_20'] = df['daily_return'].rolling(window=20).std()

    return df


# =============================================================================
# Chart Generation
# =============================================================================

def create_price_chart(df: pd.DataFrame, ticker: str) -> str:
    """Create an interactive price chart with moving averages and Bollinger Bands."""
    if df.empty or 'close' not in df.columns:
        return ""

    fig = make_subplots(
        rows=3, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.05,
        row_heights=[0.6, 0.2, 0.2],
        subplot_titles=(f'{ticker} Price & Indicators', 'Volume', 'RSI')
    )

    # Candlestick or Line chart
    if all(col in df.columns for col in ['open', 'high', 'low']):
        fig.add_trace(go.Candlestick(
            x=df['date'],
            open=df['open'],
            high=df['high'],
            low=df['low'],
            close=df['close'],
            name='Price',
            increasing_line_color='#26a69a',
            decreasing_line_color='#ef5350'
        ), row=1, col=1)
    else:
        fig.add_trace(go.Scatter(
            x=df['date'], y=df['close'],
            mode='lines', name='Close Price',
            line=dict(color='#2196F3', width=2)
        ), row=1, col=1)

    # Moving Averages
    if 'sma_20' in df.columns:
        fig.add_trace(go.Scatter(
            x=df['date'], y=df['sma_20'],
            mode='lines', name='SMA 20',
            line=dict(color='#FF9800', width=1.5)
        ), row=1, col=1)

    if 'sma_50' in df.columns:
        fig.add_trace(go.Scatter(
            x=df['date'], y=df['sma_50'],
            mode='lines', name='SMA 50',
            line=dict(color='#9C27B0', width=1.5)
        ), row=1, col=1)

    # Bollinger Bands
    if 'bb_upper' in df.columns:
        fig.add_trace(go.Scatter(
            x=df['date'], y=df['bb_upper'],
            mode='lines', name='BB Upper',
            line=dict(color='rgba(158,158,158,0.6)', width=1),
            showlegend=True
        ), row=1, col=1)
        fig.add_trace(go.Scatter(
            x=df['date'], y=df['bb_lower'],
            mode='lines', name='BB Lower',
            line=dict(color='rgba(158,158,158,0.6)', width=1),
            fill='tonexty',
            fillcolor='rgba(158,158,158,0.1)',
            showlegend=True
        ), row=1, col=1)

    # Volume
    if 'volume' in df.columns:
        colors = ['#26a69a' if df['close'].iloc[i] >= df['close'].iloc[i-1] else '#ef5350'
                  for i in range(len(df))]
        colors[0] = '#26a69a'
        fig.add_trace(go.Bar(
            x=df['date'], y=df['volume'],
            name='Volume', marker_color=colors,
            opacity=0.7
        ), row=2, col=1)

    # RSI
    if 'rsi' in df.columns:
        fig.add_trace(go.Scatter(
            x=df['date'], y=df['rsi'],
            mode='lines', name='RSI',
            line=dict(color='#673ab7', width=1.5)
        ), row=3, col=1)
        fig.add_hline(y=70, line_dash="dash", line_color="red", row=3, col=1)
        fig.add_hline(y=30, line_dash="dash", line_color="green", row=3, col=1)

    fig.update_layout(
        title=dict(text=f'{ticker} Technical Analysis', x=0.5, font_size=20),
        height=900,
        showlegend=True,
        xaxis_rangeslider_visible=False,
        template='plotly_white',
        hovermode='x unified'
    )

    fig.update_yaxes(title_text="Price (NPR)", row=1, col=1)
    fig.update_yaxes(title_text="Volume", row=2, col=1)
    fig.update_yaxes(title_text="RSI", row=3, col=1)

    return pyo.plot(fig, output_type='div', include_plotlyjs='cdn')


def create_macd_chart(df: pd.DataFrame, ticker: str) -> str:
    """Create MACD chart."""
    if df.empty or 'macd' not in df.columns:
        return ""

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df['date'], y=df['macd'],
        mode='lines', name='MACD',
        line=dict(color='#2196F3', width=1.5)
    ))

    fig.add_trace(go.Scatter(
        x=df['date'], y=df['macd_signal'],
        mode='lines', name='Signal',
        line=dict(color='#FF9800', width=1.5)
    ))

    colors = ['#26a69a' if val >= 0 else '#ef5350' for val in df['macd_histogram']]
    fig.add_trace(go.Bar(
        x=df['date'], y=df['macd_histogram'],
        name='Histogram', marker_color=colors
    ))

    fig.add_hline(y=0, line_dash="solid", line_color="black", line_width=0.5)

    fig.update_layout(
        title=f'{ticker} MACD (12, 26, 9)',
        height=400,
        template='plotly_white',
        xaxis_rangeslider_visible=False,
        hovermode='x unified'
    )

    return pyo.plot(fig, output_type='div', include_plotlyjs=False)


# =============================================================================
# HTML Report Generation
# =============================================================================

def generate_html_report(ticker: str, data: Dict[str, Any], df: pd.DataFrame) -> str:
    """Generate a comprehensive self-contained HTML report."""

    ticker_info = data.get('ticker_info', {})
    contact = data.get('ticker_contact', {})
    today = data.get('today_data', {})
    market_summary = data.get('market_summary', {})
    nepse_index = data.get('nepse_index', [])
    trade_stat = data.get('daily_trade_stat', {})
    disclosures = data.get('disclosures', [])
    top_gainers = data.get('top_gainers', [])
    top_losers = data.get('top_losers', [])

    # --- Extract company info from nested structure ---
    security_info = ticker_info.get('security', {}) if isinstance(ticker_info, dict) else {}
    company_id = security_info.get('companyId', {}) if isinstance(security_info, dict) else {}
    sector_master = company_id.get('sectorMaster', {}) if isinstance(company_id, dict) else {}
    instrument_type_obj = security_info.get('instrumentType', {}) if isinstance(security_info, dict) else {}

    company_name = security_info.get('securityName', ticker) if isinstance(security_info, dict) else ticker
    sector = sector_master.get('sectorDescription', 'N/A') if isinstance(sector_master, dict) else 'N/A'
    instrument_type = instrument_type_obj.get('description', 'N/A') if isinstance(instrument_type_obj, dict) else 'N/A'
    listing_date = security_info.get('listingDate', 'N/A') if isinstance(security_info, dict) else 'N/A'

    # Market cap / capital info from ticker_info
    market_cap = ticker_info.get('marketCapitalization', 'N/A') if isinstance(ticker_info, dict) else 'N/A'
    paid_up_capital = ticker_info.get('paidUpCapital', 'N/A') if isinstance(ticker_info, dict) else 'N/A'
    listed_shares = ticker_info.get('stockListedShares', 'N/A') if isinstance(ticker_info, dict) else 'N/A'
    public_pct = ticker_info.get('publicPercentage', 'N/A') if isinstance(ticker_info, dict) else 'N/A'
    promoter_pct = ticker_info.get('promoterPercentage', 'N/A') if isinstance(ticker_info, dict) else 'N/A'

    # --- Current price metrics ---
    current_price = 'N/A'
    price_change = 'N/A'
    price_change_pct = 'N/A'
    day_high = 'N/A'
    day_low = 'N/A'
    day_open = 'N/A'
    volume = 'N/A'
    total_traded_value = 'N/A'
    total_trades = 'N/A'
    avg_traded_price = 'N/A'
    w52_high = 'N/A'
    w52_low = 'N/A'
    prev_close = 'N/A'

    if today and isinstance(today, dict):
        current_price = today.get('closePrice') or today.get('lastTradedPrice')
        day_high = today.get('highPrice')
        day_low = today.get('lowPrice')
        day_open = today.get('openPrice')
        volume = today.get('totalTradedQuantity')
        total_traded_value = today.get('totalTradedValue')
        total_trades = today.get('totalTrades')
        avg_traded_price = today.get('averageTradedPrice')
        w52_high = today.get('fiftyTwoWeekHigh')
        w52_low = today.get('fiftyTwoWeekLow')
        prev_close = today.get('previousDayClosePrice')

    # If today data missing, use latest from df
    if not current_price and not df.empty:
        current_price = df['close'].iloc[-1] if 'close' in df.columns else None
        day_high = df['high'].iloc[-1] if 'high' in df.columns else None
        day_low = df['low'].iloc[-1] if 'low' in df.columns else None
        volume = df['volume'].iloc[-1] if 'volume' in df.columns else None

    # Technical indicator values (latest)
    latest_rsi = df['rsi'].iloc[-1] if not df.empty and 'rsi' in df.columns else None
    latest_macd = df['macd'].iloc[-1] if not df.empty and 'macd' in df.columns else None
    latest_bb_upper = df['bb_upper'].iloc[-1] if not df.empty and 'bb_upper' in df.columns else None
    latest_bb_lower = df['bb_lower'].iloc[-1] if not df.empty and 'bb_lower' in df.columns else None
    volatility = df['volatility_20'].iloc[-1] if not df.empty and 'volatility_20' in df.columns else None

    # Calculate 52-week high/low from price history df
    high_52w_hist = df['high'].max() if not df.empty and 'high' in df.columns else None
    low_52w_hist = df['low'].min() if not df.empty and 'low' in df.columns else None
    avg_volume = df['volume'].mean() if not df.empty and 'volume' in df.columns else None

    # Use API 52W values if available, else use history
    high_52w = w52_high if w52_high else high_52w_hist
    low_52w = w52_low if w52_low else low_52w_hist

    # Price change from df
    if not df.empty and len(df) > 1 and 'close' in df.columns:
        prev_close_calc = df['close'].iloc[-2]
        latest_close = df['close'].iloc[-1]
        price_change = latest_close - prev_close_calc
        price_change_pct = (price_change / prev_close_calc) * 100

    # Market summary data
    market_status = "OPEN" if data.get('market_open') else "CLOSED"

    # Market summary is a list of {detail, value} dicts
    market_summary_dict = {}
    if isinstance(market_summary, list):
        for item in market_summary:
            if isinstance(item, dict):
                detail = item.get('detail', '')
                value = item.get('value', 'N/A')
                market_summary_dict[detail] = value
    elif isinstance(market_summary, dict):
        market_summary_dict = market_summary

    # Extract total turnover etc from the list
    total_turnover = 'N/A'
    total_volume = 'N/A'
    total_transactions = 'N/A'
    for k, v in market_summary_dict.items():
        k_lower = str(k).lower()
        if 'turnover' in k_lower:
            total_turnover = v
        elif 'volume' in k_lower or 'share' in k_lower:
            total_volume = v
        elif 'transaction' in k_lower:
            total_transactions = v

    # NEPSE index data - find by name 'NEPSE' or id 58
    nepse_value = 'N/A'
    nepse_change = 'N/A'
    nepse_per_change = 'N/A'
    nepse_close = 'N/A'
    if nepse_index and isinstance(nepse_index, list):
        for idx in nepse_index:
            if isinstance(idx, dict):
                idx_name = idx.get('index', '') or idx.get('indexName', '')
                if 'nepse' in idx_name.lower() or idx.get('id') == 58:
                    nepse_value = idx.get('currentValue') or idx.get('close')
                    nepse_change = idx.get('change')
                    nepse_per_change = idx.get('perChange')
                    nepse_close = idx.get('close')
                    break
        # Fallback: if no NEPSE found, use first index
        if nepse_value == 'N/A' and nepse_index:
            first = nepse_index[0] if isinstance(nepse_index[0], dict) else {}
            nepse_value = first.get('currentValue', 'N/A')
            nepse_change = first.get('change', 'N/A')
            nepse_per_change = first.get('perChange', 'N/A')

    # Company profile from contact
    company_profile = contact.get('companyProfile', '') if isinstance(contact, dict) else ''
    company_email = contact.get('companyEmail', 'N/A') if isinstance(contact, dict) else 'N/A'
    company_phone = contact.get('phoneNumber', 'N/A') if isinstance(contact, dict) else 'N/A'
    company_address = contact.get('addressField', 'N/A') if isinstance(contact, dict) else 'N/A'
    company_town = contact.get('town', 'N/A') if isinstance(contact, dict) else 'N/A'
    company_website = company_id.get('companyWebsite', 'N/A') if isinstance(company_id, dict) else 'N/A'

    # Generate charts
    price_chart_div = create_price_chart(df, ticker)
    macd_chart_div = create_macd_chart(df, ticker)

    # Determine trend and signals
    trend = "NEUTRAL"
    signal = "HOLD"
    if latest_rsi is not None and latest_macd is not None:
        macd_signal_val = df['macd_signal'].iloc[-1] if not df.empty and 'macd_signal' in df.columns else 0
        if latest_rsi < 30 and latest_macd > macd_signal_val:
            signal = "BUY"
            trend = "BULLISH (Oversold)"
        elif latest_rsi > 70 and latest_macd < macd_signal_val:
            signal = "SELL"
            trend = "BEARISH (Overbought)"
        elif latest_rsi > 50 and latest_macd > 0:
            trend = "BULLISH"
            signal = "HOLD/BUY"
        elif latest_rsi < 50 and latest_macd < 0:
            trend = "BEARISH"
            signal = "HOLD/SELL"

    # Helper for safe formatting
    def fmt(val, decimals=2, prefix="", suffix=""):
        if val is None or val == 'N/A' or (isinstance(val, float) and np.isnan(val)):
            return "N/A"
        try:
            return f"{prefix}{float(val):,.{decimals}f}{suffix}"
        except:
            return str(val)

    # Build disclosures HTML
    disclosures_html = ""
    for i, news in enumerate(disclosures[:5]):
        title = news.get('newsTitle', 'No Title') if isinstance(news, dict) else str(news)
        date = news.get('newsDate', 'N/A') if isinstance(news, dict) else 'N/A'
        disclosures_html += f"""
        <div class="news-item">
            <div class="news-title">{title}</div>
            <div class="news-date">{date}</div>
        </div>
        """
    if not disclosures_html:
        disclosures_html = "<p>No recent disclosures available.</p>"

    # Top gainers/losers HTML
    def build_top_table(items, color):
        html = '<table class="mini-table"><thead><tr><th>Symbol</th><th>Change %</th></tr></thead><tbody>'
        for item in items[:5]:
            if isinstance(item, dict):
                sym = item.get('symbol', 'N/A')
                change = item.get('pointChange', item.get('change', 'N/A'))
                pct = item.get('percentageChange', item.get('changePercent', 'N/A'))
                html += f'<tr><td>{sym}</td><td style="color:{color}">{fmt(pct, 2, suffix="%")}</td></tr>'
        html += '</tbody></table>'
        return html

    gainers_html = build_top_table(top_gainers, '#26a69a')
    losers_html = build_top_table(top_losers, '#ef5350')

    # Price history table (last 10 rows)
    history_rows = ""
    if not df.empty:
        recent_df = df.tail(10).sort_values('date', ascending=False)
        for _, row in recent_df.iterrows():
            date_str = row['date'].strftime('%Y-%m-%d') if pd.notnull(row['date']) else 'N/A'
            close = fmt(row.get('close'), 2)
            high = fmt(row.get('high'), 2)
            low = fmt(row.get('low'), 2)
            vol = fmt(row.get('volume'), 0)
            rsi_val = fmt(row.get('rsi'), 1) if 'rsi' in row else 'N/A'
            history_rows += f"<tr><td>{date_str}</td><td>{close}</td><td>{high}</td><td>{low}</td><td>{vol}</td><td>{rsi_val}</td></tr>"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{ticker} - NEPSE Stock Analysis Report</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e0e0e0;
            line-height: 1.6;
            min-height: 100vh;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
            padding: 40px;
            border-radius: 16px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }}
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #e94560, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .header .subtitle {{
            color: #8892b0;
            font-size: 1.1em;
        }}
        .badge {{
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin-right: 10px;
            margin-top: 15px;
        }}
        .badge-green {{ background: rgba(38, 166, 154, 0.2); color: #26a69a; border: 1px solid #26a69a; }}
        .badge-red {{ background: rgba(239, 83, 80, 0.2); color: #ef5350; border: 1px solid #ef5350; }}
        .badge-blue {{ background: rgba(33, 150, 243, 0.2); color: #2196f3; border: 1px solid #2196f3; }}
        .badge-purple {{ background: rgba(156, 39, 176, 0.2); color: #9c27b0; border: 1px solid #9c27b0; }}

        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }}
        .card {{
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }}
        .card:hover {{ transform: translateY(-5px); }}
        .card h2 {{
            font-size: 1.3em;
            margin-bottom: 20px;
            color: #e94560;
            border-bottom: 2px solid rgba(233, 69, 96, 0.3);
            padding-bottom: 10px;
        }}
        .metric-row {{
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        .metric-row:last-child {{ border-bottom: none; }}
        .metric-label {{ color: #8892b0; font-size: 0.95em; }}
        .metric-value {{ font-weight: 600; font-size: 1em; }}
        .metric-value.positive {{ color: #26a69a; }}
        .metric-value.negative {{ color: #ef5350; }}

        .big-number {{
            font-size: 2.5em;
            font-weight: 700;
            margin: 10px 0;
        }}
        .big-number.positive {{ color: #26a69a; }}
        .big-number.negative {{ color: #ef5350; }}

        .signal-box {{
            text-align: center;
            padding: 30px;
            border-radius: 12px;
            margin: 20px 0;
        }}
        .signal-buy {{ background: rgba(38, 166, 154, 0.1); border: 2px solid #26a69a; }}
        .signal-sell {{ background: rgba(239, 83, 80, 0.1); border: 2px solid #ef5350; }}
        .signal-hold {{ background: rgba(255, 152, 0, 0.1); border: 2px solid #ff9800; }}

        .chart-container {{
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            border: 1px solid rgba(255,255,255,0.1);
        }}

        .news-item {{
            padding: 15px;
            margin-bottom: 10px;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
            border-left: 3px solid #e94560;
        }}
        .news-title {{ font-weight: 600; margin-bottom: 5px; }}
        .news-date {{ font-size: 0.85em; color: #8892b0; }}

        table.data-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }}
        table.data-table th {{
            text-align: left;
            padding: 12px;
            background: rgba(233, 69, 96, 0.2);
            color: #e94560;
            font-weight: 600;
        }}
        table.data-table td {{
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        table.data-table tr:hover {{ background: rgba(255,255,255,0.03); }}

        .mini-table {{ width: 100%; border-collapse: collapse; }}
        .mini-table th, .mini-table td {{ padding: 8px; text-align: left; font-size: 0.9em; }}
        .mini-table th {{ color: #e94560; border-bottom: 1px solid rgba(255,255,255,0.1); }}

        .footer {{
            text-align: center;
            padding: 30px;
            color: #8892b0;
            font-size: 0.9em;
            margin-top: 40px;
        }}

        @media (max-width: 768px) {{
            .header h1 {{ font-size: 1.8em; }}
            .grid {{ grid-template-columns: 1fr; }}
            .big-number {{ font-size: 2em; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{ticker}</h1>
            <div class="subtitle">{company_name}</div>
            <span class="badge badge-{'green' if data.get('market_open') else 'red'}">Market: {market_status}</span>
            <span class="badge badge-blue">{sector}</span>
            <span class="badge badge-purple">{instrument_type}</span>
            <span class="badge badge-blue">Listed: {listing_date}</span>
        </div>

        <!-- Key Metrics Row -->
        <div class="grid">
            <div class="card">
                <h2>Current Price</h2>
                <div class="big-number {'positive' if price_change and float(price_change) >= 0 else 'negative' if price_change and float(price_change) < 0 else ''}">
                    NPR {fmt(current_price)}
                </div>
                <div class="metric-value {'positive' if price_change and float(price_change) >= 0 else 'negative' if price_change and float(price_change) < 0 else ''}">
                    {'+' if price_change and float(price_change) >= 0 else ''}{fmt(price_change)} ({'+' if price_change_pct and float(price_change_pct) >= 0 else ''}{fmt(price_change_pct)}%)
                </div>
            </div>

            <div class="card">
                <h2>Technical Signal</h2>
                <div class="signal-box signal-{signal.lower() if signal in ['BUY', 'SELL', 'HOLD'] else 'hold'}">
                    <div class="big-number">{signal}</div>
                    <div style="font-size:1.1em; margin-top:10px;">{trend}</div>
                </div>
            </div>

            <div class="card">
                <h2>Market Summary</h2>
                <div class="metric-row">
                    <span class="metric-label">NEPSE Index</span>
                    <span class="metric-value">{fmt(nepse_value)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Change</span>
                    <span class="metric-value {'positive' if nepse_change and float(nepse_change) >= 0 else 'negative' if nepse_change and float(nepse_change) < 0 else ''}">{fmt(nepse_change)} ({fmt(nepse_per_change)}%)</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Market</span>
                    <span class="metric-value">{market_status}</span>
                </div>
            </div>
        </div>

        <!-- Technical Indicators -->
        <div class="grid">
            <div class="card">
                <h2>Technical Indicators</h2>
                <div class="metric-row">
                    <span class="metric-label">RSI (14)</span>
                    <span class="metric-value {'positive' if latest_rsi and latest_rsi < 30 else 'negative' if latest_rsi and latest_rsi > 70 else ''}">{fmt(latest_rsi, 1)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">MACD</span>
                    <span class="metric-value {'positive' if latest_macd and latest_macd > 0 else 'negative' if latest_macd and latest_macd < 0 else ''}">{fmt(latest_macd, 3)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Bollinger Upper</span>
                    <span class="metric-value">{fmt(latest_bb_upper)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Bollinger Lower</span>
                    <span class="metric-value">{fmt(latest_bb_lower)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Volatility (20d)</span>
                    <span class="metric-value">{fmt(volatility, 2)}%</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">52W High</span>
                    <span class="metric-value positive">{fmt(high_52w)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">52W Low</span>
                    <span class="metric-value negative">{fmt(low_52w)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Avg Volume</span>
                    <span class="metric-value">{fmt(avg_volume, 0)}</span>
                </div>
            </div>

            <div class="card">
                <h2>Market Overview</h2>
                <div class="metric-row">
                    <span class="metric-label">NEPSE Index</span>
                    <span class="metric-value">{fmt(nepse_value)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">NEPSE Change</span>
                    <span class="metric-value {'positive' if nepse_change and float(nepse_change) >= 0 else 'negative' if nepse_change and float(nepse_change) < 0 else ''}">{fmt(nepse_change)} ({fmt(nepse_per_change)}%)</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">NEPSE Close</span>
                    <span class="metric-value">{fmt(nepse_close)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Total Turnover</span>
                    <span class="metric-value">{fmt(total_turnover, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Total Volume</span>
                    <span class="metric-value">{fmt(total_volume, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Total Transactions</span>
                    <span class="metric-value">{fmt(total_transactions, 0)}</span>
                </div>
            </div>

            <div class="card">
                <h2>Company Info</h2>
                <div class="metric-row">
                    <span class="metric-label">Sector</span>
                    <span class="metric-value">{sector}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Instrument</span>
                    <span class="metric-value">{instrument_type}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Listing Date</span>
                    <span class="metric-value">{listing_date}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Website</span>
                    <span class="metric-value">{company_website}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Email</span>
                    <span class="metric-value">{company_email}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Phone</span>
                    <span class="metric-value">{company_phone}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Address</span>
                    <span class="metric-value">{company_address}, {company_town}</span>
                </div>
            </div>

            <div class="card">
                <h2>Capital Structure</h2>
                <div class="metric-row">
                    <span class="metric-label">Market Cap (NPR)</span>
                    <span class="metric-value">{fmt(market_cap, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Paid-up Capital</span>
                    <span class="metric-value">{fmt(paid_up_capital, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Listed Shares</span>
                    <span class="metric-value">{fmt(listed_shares, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Public Holding</span>
                    <span class="metric-value">{fmt(public_pct)}%</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Promoter Holding</span>
                    <span class="metric-value">{fmt(promoter_pct)}%</span>
                </div>
            </div>

            <div class="card">
                <h2>Today's Trading</h2>
                <div class="metric-row">
                    <span class="metric-label">Open</span>
                    <span class="metric-value">{fmt(day_open)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">High</span>
                    <span class="metric-value positive">{fmt(day_high)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Low</span>
                    <span class="metric-value negative">{fmt(day_low)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Volume</span>
                    <span class="metric-value">{fmt(volume, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Turnover (NPR)</span>
                    <span class="metric-value">{fmt(total_traded_value, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Trades</span>
                    <span class="metric-value">{fmt(total_trades, 0)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Avg Price</span>
                    <span class="metric-value">{fmt(avg_traded_price)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Prev Close</span>
                    <span class="metric-value">{fmt(prev_close)}</span>
                </div>
            </div>
        </div>

        <!-- Main Price Chart -->
        <div class="chart-container">
            {price_chart_div}
        </div>

        <!-- MACD Chart -->
        <div class="chart-container">
            {macd_chart_div}
        </div>

        <!-- Price History Table -->
        <div class="card" style="margin-bottom: 30px;">
            <h2>Recent Price History</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Close</th>
                        <th>High</th>
                        <th>Low</th>
                        <th>Volume</th>
                        <th>RSI</th>
                    </tr>
                </thead>
                <tbody>
                    {history_rows}
                </tbody>
            </table>
        </div>

        <!-- Market Movers -->
        <div class="grid">
            <div class="card">
                <h2>Top Gainers</h2>
                {gainers_html}
            </div>
            <div class="card">
                <h2>Top Losers</h2>
                {losers_html}
            </div>
            <div class="card">
                <h2>Recent Disclosures</h2>
                {disclosures_html}
            </div>
        </div>

        <div class="footer">
            <p>Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} using NEPSE Scraper API</p>
            <p style="margin-top:10px; font-size:0.85em;">Disclaimer: This report is for informational purposes only and does not constitute investment advice.</p>
        </div>
    </div>
</body>
</html>"""

    return html_content


def main():
    print("=" * 60)
    print("   NEPSE Stock Report Generator")
    print("=" * 60)
    print()

    ticker = input("Enter stock ticker symbol (e.g., NABIL, NICA, HBL): ").strip().upper()

    if not ticker:
        print("Error: No ticker provided. Exiting.")
        sys.exit(1)

    print(f"\nGenerating comprehensive report for: {ticker}")
    print("This may take a moment...\n")

    # Fetch data
    fetcher = NEPSEDataFetcher()
    data = fetcher.fetch_all(ticker)

    # Process price history (handles paginated dict or list)
    raw_history = data.get('price_history', {})
    df = process_price_history(raw_history)

    # Generate HTML
    html_content = generate_html_report(ticker, data, df)

    # Save file
    filename = f"{ticker}_NEPSE_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    filepath = os.path.abspath(filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"\n{'='*60}")
    print(f"  Report saved successfully!")
    print(f"  File: {filepath}")
    print(f"{'='*60}")
    print(f"\nOpen this file in your browser to view the interactive report.")


if __name__ == "__main__":
    main()

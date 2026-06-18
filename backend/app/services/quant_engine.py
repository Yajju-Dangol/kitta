import pandas as pd
import numpy as np
from typing import Dict, Any

def compute_advanced_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes advanced mathematical indicators requested by the user from OHLCV data.
    Takes a DataFrame with columns: Date, Open, High, Low, Close, Volume.
    """
    if len(df) < 60:
        return {"error": "Not enough data points for quant analysis"}

    # Limit to the last 200 days for performance on heavy stats
    calc_df = df.tail(200).copy().reset_index(drop=True)
    
    # 1. Trend & Directional
    # HMA (Hull Moving Average)
    wma_half = calc_df['Close'].rolling(window=int(20/2)).apply(lambda x: np.sum(np.arange(1, len(x)+1) * x) / np.sum(np.arange(1, len(x)+1)), raw=True)
    wma_full = calc_df['Close'].rolling(window=20).apply(lambda x: np.sum(np.arange(1, len(x)+1) * x) / np.sum(np.arange(1, len(x)+1)), raw=True)
    raw_hma = 2 * wma_half - wma_full
    calc_df['HMA20'] = raw_hma.rolling(window=int(np.sqrt(20))).apply(lambda x: np.sum(np.arange(1, len(x)+1) * x) / np.sum(np.arange(1, len(x)+1)), raw=True)

    # 2. Volatility (ATR)
    high_low = calc_df['High'] - calc_df['Low']
    high_close = np.abs(calc_df['High'] - calc_df['Close'].shift())
    low_close = np.abs(calc_df['Low'] - calc_df['Close'].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    calc_df['ATR'] = tr.rolling(window=14).mean()

    # 3. Market Microstructure
    body = np.abs(calc_df['Close'] - calc_df['Open'])
    total_range = calc_df['High'] - calc_df['Low']
    # Avoid div by zero
    total_range = total_range.replace(0, 0.0001)
    
    calc_df['Body_Ratio'] = body / total_range
    calc_df['Upper_Wick_Ratio'] = (calc_df['High'] - calc_df[['Open', 'Close']].max(axis=1)) / total_range
    calc_df['Lower_Wick_Ratio'] = (calc_df[['Open', 'Close']].min(axis=1) - calc_df['Low']) / total_range

    # Opening Gap
    calc_df['Opening_Gap'] = (calc_df['Open'] - calc_df['Close'].shift(1)) / calc_df['Close'].shift(1)

    # 4. Statistical (Log Returns & Z-Scores)
    calc_df['Log_Return'] = np.log(calc_df['Close'] / calc_df['Close'].shift(1))
    roll_mean = calc_df['Close'].rolling(window=20).mean()
    roll_std = calc_df['Close'].rolling(window=20).std()
    calc_df['Z_Score'] = (calc_df['Close'] - roll_mean) / roll_std

    # Skewness and Kurtosis
    calc_df['Skewness'] = calc_df['Log_Return'].rolling(window=20).skew()
    calc_df['Kurtosis'] = calc_df['Log_Return'].rolling(window=20).kurt()
    
    # Fractal Dimension
    n_period = 20
    diff_abs = calc_df['Close'].diff().abs()
    L = diff_abs.rolling(window=n_period).sum()
    R_fractal = (calc_df['Close'] - calc_df['Close'].shift(n_period)).abs()
    # Avoid log(0)
    L = L.replace(0, np.nan)
    R_fractal = R_fractal.replace(0, np.nan)
    calc_df['Fractal_Dimension'] = 1 + (np.log(L) - np.log(R_fractal)) / np.log(n_period)

    # Hurst Exponent (R/S Analysis)
    def calc_hurst(x):
        if len(x) < n_period: return np.nan
        mean_val = np.mean(x)
        cum_dev = np.cumsum(x - mean_val)
        R = np.max(cum_dev) - np.min(cum_dev)
        S = np.std(x)
        if S == 0 or R == 0: return 0.5
        return np.log(R/S) / np.log(n_period)

    calc_df['Hurst_Exponent'] = calc_df['Close'].rolling(window=n_period).apply(calc_hurst, raw=True)
    
    # 5. Volume Dynamics (VWAP)
    cum_vol = calc_df['Volume'].cumsum()
    cum_vol_price = (calc_df['Close'] * calc_df['Volume']).cumsum()
    calc_df['VWAP'] = cum_vol_price / cum_vol.replace(0, 1)

    latest = calc_df.iloc[-1]
    
    # Clean up NaNs
    def safe_float(val):
        if pd.isna(val) or np.isinf(val):
            return 0.0
        return float(val)

    # Get trailing prices for sparkline
    prices = calc_df['Close'].tail(150).tolist()
    
    return {
        "trend": {
            "hma20": safe_float(latest['HMA20']),
            "current_price": safe_float(latest['Close']),
            "trend_status": "Bullish" if latest['Close'] > latest['HMA20'] else "Bearish"
        },
        "historical_prices": prices,
        "volatility": {
            "atr14": safe_float(latest['ATR']),
        },
        "microstructure": {
            "body_ratio": safe_float(latest['Body_Ratio']),
            "upper_wick_ratio": safe_float(latest['Upper_Wick_Ratio']),
            "lower_wick_ratio": safe_float(latest['Lower_Wick_Ratio']),
            "opening_gap_pct": safe_float(latest['Opening_Gap'] * 100)
        },
        "statistical": {
            "z_score": safe_float(latest['Z_Score']),
            "skewness": safe_float(latest['Skewness']),
            "kurtosis": safe_float(latest['Kurtosis']),
            "log_return_daily": safe_float(latest['Log_Return']),
            "fractal_dimension": safe_float(latest['Fractal_Dimension']),
            "hurst_exponent": safe_float(latest['Hurst_Exponent'])
        },
        "volume": {
            "vwap": safe_float(latest['VWAP']),
            "volume_today": int(latest['Volume'])
        }
    }

import os
import pandas as pd
import numpy as np
from app.models.responses import HistoryDataPoint

class HistoryParser:
    def __init__(self, static_dir: str = "static"):
        self.static_dir = static_dir
        self.charts_dir = os.path.join(self.static_dir, "charts")

    def _clean_nan(self, val):
        """Convert NaN to None for JSON serialization compatibility."""
        if pd.isna(val):
            return None
        return float(val)

    def parse_historical_csv(self, symbol: str) -> list[HistoryDataPoint]:
        file_path = os.path.join(self.charts_dir, f"{symbol.upper()}_historical_data.csv")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Historical data for {symbol} not found at {file_path}")
            
        try:
            df = pd.read_csv(file_path)
            # Ensure proper string/numeric types where needed
            df = df.replace([np.inf, -np.inf], np.nan)
            
            data_points = []
            for _, row in df.iterrows():
                point = HistoryDataPoint(
                    date=str(row.get('Date', '')),
                    open=self._clean_nan(row.get('Open')),
                    high=self._clean_nan(row.get('High')),
                    low=self._clean_nan(row.get('Low')),
                    close=self._clean_nan(row.get('Close')),
                    volume=int(row.get('Volume', 0)) if not pd.isna(row.get('Volume')) else 0,
                    macd=self._clean_nan(row.get('MACD')),
                    macd_signal=self._clean_nan(row.get('MACD_Signal')),
                    rsi=self._clean_nan(row.get('RSI')),
                    ema20=self._clean_nan(row.get('EMA20')),
                    ema50=self._clean_nan(row.get('EMA50')),
                    bb_upper=self._clean_nan(row.get('BB_Upper')),
                    bb_lower=self._clean_nan(row.get('BB_Lower'))
                )
                data_points.append(point)
            
            return data_points
            
        except Exception as e:
            raise ValueError(f"Error parsing historical CSV for {symbol}: {str(e)}")

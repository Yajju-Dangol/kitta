from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class HistoryDataPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    rsi: Optional[float] = None
    ema20: Optional[float] = None
    ema50: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_lower: Optional[float] = None

class HistoryResponse(BaseModel):
    symbol: str
    status: str
    data: List[HistoryDataPoint]

class NepseMarketSummaryResponse(BaseModel):
    status: str
    data: List[Dict[str, Any]]

class NepseTopGainersResponse(BaseModel):
    status: str
    data: List[Dict[str, Any]]

class ScrapedNewsItem(BaseModel):
    id: str
    date: str
    symbol: str
    title: str
    bullets: List[str]

class ScrapedDataResponse(BaseModel):
    status: str
    data: List[ScrapedNewsItem]

class QuantMetricsResponse(BaseModel):
    symbol: str
    status: str
    trend: Dict[str, Any]
    historical_prices: List[float]
    volatility: Dict[str, Any]
    microstructure: Dict[str, Any]
    statistical: Dict[str, Any]
    volume: Dict[str, Any]

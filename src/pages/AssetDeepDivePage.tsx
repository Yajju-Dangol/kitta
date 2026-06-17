import { useState, useEffect } from "react";
import { Stock, NewsItem } from "../types";
import TimeseriesChart from "../components/TimeseriesChart";
import NewsTimeline from "../components/NewsTimeline";
import SidecarAssistant from "../components/SidecarAssistant";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AssetDeepDivePageProps {
  stocks: Stock[];
  selectedSymbol: string;
  onNavigateToCoreDeck: () => void;
}

interface DeepMetrics {
  latest_rsi?: number;
  latest_macd?: number;
  latest_macd_signal?: number;
  latest_ema20?: number;
  latest_ema50?: number;
  bb_upper?: number;
  bb_lower?: number;
}

export default function AssetDeepDivePage({
  stocks,
  selectedSymbol,
  onNavigateToCoreDeck
}: AssetDeepDivePageProps) {
  const initialStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
  const [activeStock, setActiveStock] = useState<Stock>(initialStock);
  const [deepMetrics, setDeepMetrics] = useState<DeepMetrics | null>(null);
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sidecarPrompt, setSidecarPrompt] = useState<string | undefined>(undefined);
  const [chartPath, setChartPath] = useState<string | undefined>(undefined);

  useEffect(() => {
    const stockObj = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
    setActiveStock(stockObj);
    setIsMetricsLoading(true);
    setDeepMetrics(null);
    setChartPath(undefined);
    
    fetch(`/api/metrics/${stockObj.symbol}`)
      .then(res => {
        if(res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (data.status === "success") {
          setActiveStock({
            ...stockObj,
            price: data.latest_close,
            pe: data.latest_macd || stockObj.pe,
          });
          setDeepMetrics({
            latest_rsi: data.latest_rsi,
            latest_macd: data.latest_macd,
            latest_macd_signal: data.latest_macd_signal,
            latest_ema20: data.latest_ema20,
            latest_ema50: data.latest_ema50,
            bb_upper: data.bb_upper,
            bb_lower: data.bb_lower,
          });
          setChartPath(data.chart_path);
        }
      })
      .catch(() => {
        setActiveStock(stockObj);
      })
      .finally(() => {
        setIsMetricsLoading(false);
      });

    setSelectedEventId(null);
    setSidecarPrompt(undefined);

    fetch("/api/news")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        const filtered = data.filter((n: NewsItem) => n.symbol === (stockObj?.symbol || "NABIL"));
        setNews(filtered);
      })
      .catch(() => {});
  }, [selectedSymbol, stocks]);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleSelectEvent = (evtId: string | null) => {
    setSelectedEventId(evtId);
    if (!evtId) {
      setSidecarPrompt(undefined);
      return;
    }
    
    if (evtId === "news_2") {
      setSidecarPrompt("Analyze the yield impact of the recent NPR 35 dividend.");
    } else if (evtId === "news_1") {
      setSidecarPrompt("How does the 14% Q3 net profit growth affect NABIL's P/E?");
    } else if (evtId === "news_3") {
      setSidecarPrompt("Analyze the value impact of the FMO USD 25M credit line.");
    } else if (evtId === "news_4") {
      setSidecarPrompt("Evaluate grid integration impact of the 8.5 MW Piluwa testing.");
    }
  };

  if (!activeStock) {
    return <div className="p-5 text-zinc-500">Loading asset data...</div>;
  }

  const isUndervalued = activeStock.pe < 20.0;

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto font-sans bg-black">
      {/* Return & Metadata Header Strip */}
      <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 rounded-xl">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onNavigateToCoreDeck}
            className="group font-sans text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900 px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-bold text-zinc-100">{activeStock.symbol}</span>
              <span className="text-zinc-500 font-medium text-xs">•</span>
              <span className="text-zinc-300 text-xs font-medium">{activeStock.name}</span>
            </div>
            <span className="text-[10px] text-zinc-500 tracking-wide font-medium uppercase mt-0.5">{activeStock.sector} Sector Analysis</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button 
            onClick={handleRefreshData}
            className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer mr-2 flex items-center justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isMetricsLoading ? 'animate-spin text-[#10B981]' : ''}`} />
          </button>

          {isUndervalued ? (
            <div className="px-3 py-1 bg-emerald-950/30 border border-[#10B981]/40 text-[#10B981] rounded-full font-semibold text-[11px] uppercase tracking-wide">
              Undervalued (PE {activeStock.pe?.toFixed(1) || 'N/A'})
            </div>
          ) : (
            <div className="px-3 py-1 bg-red-950/30 border border-red-800/40 text-red-400 rounded-full font-semibold text-[11px] uppercase tracking-wide">
              Premium (PE {activeStock.pe?.toFixed(1) || 'N/A'})
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 flex-1">
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <TimeseriesChart 
            symbol={activeStock.symbol} 
            price={activeStock.price} 
            sparkline={activeStock.sparkline}
            selectedEventId={selectedEventId}
            onSelectEventId={handleSelectEvent}
            chartPath={chartPath}
          />

          <Card className="flex flex-col space-y-4 rounded-xl">
            <CardHeader className="border-b border-zinc-800/50 pb-3 flex flex-row justify-between items-center px-4 py-3">
              <CardTitle className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Super Depth Data Analysis</CardTitle>
              {isMetricsLoading && (
                <span className="flex items-center space-x-1.5 text-zinc-500 text-[10px]">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Scraping metrics...</span>
                </span>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {deepMetrics ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-black p-3 rounded-lg border border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500 block">RSI</span>
                    <span className="text-sm font-bold text-zinc-200 mt-1 block">{deepMetrics.latest_rsi?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500 block">MACD Line</span>
                    <span className="text-sm font-bold text-zinc-200 mt-1 block">{deepMetrics.latest_macd?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500 block">MACD Signal</span>
                    <span className="text-sm font-bold text-zinc-200 mt-1 block">{deepMetrics.latest_macd_signal?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500 block">EMA 20-Day</span>
                    <span className="text-sm font-bold text-zinc-200 mt-1 block">NPR {deepMetrics.latest_ema20?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500 block">EMA 50-Day</span>
                    <span className="text-sm font-bold text-zinc-200 mt-1 block">NPR {deepMetrics.latest_ema50?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="bg-black p-3 rounded-lg border border-zinc-800/50">
                    <span className="text-[10px] text-zinc-500 block">Bollinger Bounds</span>
                    <span className="text-sm font-bold text-zinc-200 mt-1 block">{deepMetrics.bb_upper?.toFixed(0)} / {deepMetrics.bb_lower?.toFixed(0)}</span>
                  </div>
                </div>
              ) : (
                !isMetricsLoading && (
                  <div className="text-center py-4 text-xs text-zinc-500 italic">
                    Deep metrics extraction failed or unavailable for this asset.
                  </div>
                )
              )}
            </CardContent>
          </Card>

          <NewsTimeline 
            news={news} 
            selectedNewsId={selectedEventId}
            onSelectNewsId={handleSelectEvent}
          />
        </div>

        <div className="lg:col-span-4 h-full min-h-[500px]">
          <SidecarAssistant 
            symbol={activeStock.symbol} 
            price={activeStock.price} 
            pe={activeStock.pe} 
            triggerPrompt={sidecarPrompt}
          />
        </div>
      </div>
    </div>
  );
}

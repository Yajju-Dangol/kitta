import { useState, useEffect } from "react";
import { Stock, NewsItem } from "../types";
import TimeseriesChart from "../components/TimeseriesChart";
import NewsTimeline from "../components/NewsTimeline";
import SidecarAssistant from "../components/SidecarAssistant";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface AssetDeepDivePageProps {
  stocks: Stock[];
  selectedSymbol: string;
  onNavigateToCoreDeck: () => void;
}

export default function AssetDeepDivePage({
  stocks,
  selectedSymbol,
  onNavigateToCoreDeck
}: AssetDeepDivePageProps) {
  const [activeStock, setActiveStock] = useState<Stock | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sidecarPrompt, setSidecarPrompt] = useState<string | undefined>(undefined);

  // Load target stocks and contextual scraped news logs from API
  useEffect(() => {
    const stockObj = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
    setActiveStock(stockObj || null);
    setSelectedEventId(null);
    setSidecarPrompt(undefined);

    fetch("/api/news")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        // Filter news matching current selected symbol
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
    
    // Wire up dynamic prompts for the Sidecar based on timeline clicks
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
    return (
      <div className="flex-1 flex items-center justify-center font-mono text-xs text-zinc-500">
        Loading target entity matrices...
      </div>
    );
  }

  const isUndervalued = activeStock.pe < 20.0;

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto font-sans">
      {/* Return & Metadata Header Strip */}
      <div className="bg-[#09090b] rounded-xl border border-zinc-800/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 shadow-sm">
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
            <span className="text-[10px] text-zinc-500 tracking-wide font-medium uppercase mt-0.5">{activeStock.sector} Sector Analysis Model</span>
          </div>
        </div>

        {/* Dynamic target tags */}
        <div className="flex items-center space-x-2 text-xs">
          <button 
            onClick={handleRefreshData}
            className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-750 transition-colors cursor-pointer mr-2 flex items-center justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#10B981]' : ''}`} />
          </button>

          {isUndervalued ? (
            <div className="px-3 py-1 bg-emerald-950/30 border border-[#10B981]/40 text-[#10B981] rounded-full font-semibold text-[11px] uppercase tracking-wide">
              Undervalued (PE {activeStock.pe})
            </div>
          ) : (
            <div className="px-3 py-1 bg-red-950/30 border border-red-800/40 text-red-400 rounded-full font-semibold text-[11px] uppercase tracking-wide">
              Premium Threshold Reached
            </div>
          )}
        </div>
      </div>

      {/* Primary columns */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 flex-1">
        {/* Left deep-dive column */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Timeseries vector Chart canvas */}
          <TimeseriesChart 
            symbol={activeStock.symbol} 
            price={activeStock.price} 
            sparkline={activeStock.sparkline}
            selectedEventId={selectedEventId}
            onSelectEventId={handleSelectEvent}
          />

          {/* Aggregated scraped news logs accordion */}
          <NewsTimeline 
            news={news} 
            selectedNewsId={selectedEventId}
            onSelectNewsId={handleSelectEvent}
          />
        </div>

        {/* Right Isolated Sidecar Assistant column */}
        <div className="lg:col-span-4">
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

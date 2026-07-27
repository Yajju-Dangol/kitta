import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Search, TrendingUp, Activity, Maximize2, BarChart2, Hash, Percent, Briefcase, Bookmark, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import TimeseriesChart from "../components/TimeseriesChart";
import { Session } from "@supabase/supabase-js";

interface AssetDeepDivePageProps {
  stocks?: any[];
  selectedSymbol?: string;
  onNavigateToCoreDeck: () => void;
  session?: Session | null;
}

export default function AssetDeepDivePage({
  selectedSymbol = "NEPSE",
  onNavigateToCoreDeck,
  session
}: AssetDeepDivePageProps) {
  const [searchInput, setSearchInput] = useState("");
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol);
  
  const [quantData, setQuantData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [addingWatchlist, setAddingWatchlist] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const checkWatchlistStatus = (symbol: string) => {
    fetch("/api/watchlist", { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.stocks)) {
          const exists = data.stocks.some((s: any) => s.symbol.toUpperCase() === symbol.toUpperCase());
          setInWatchlist(exists);
        }
      })
      .catch(() => {});
  };

  const handleToggleWatchlist = () => {
    setAddingWatchlist(true);
    if (inWatchlist) {
      fetch(`/api/watchlist/remove/${activeSymbol}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
        .then(() => setInWatchlist(false))
        .catch(() => {})
        .finally(() => setAddingWatchlist(false));
    } else {
      fetch("/api/watchlist/add", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ symbol: activeSymbol }),
      })
        .then(() => setInWatchlist(true))
        .catch(() => {})
        .finally(() => setAddingWatchlist(false));
    }
  };

  const fetchQuantData = (symbol: string) => {
    setIsLoading(true);
    setError(null);
    setQuantData(null);
    checkWatchlistStatus(symbol);
    
    fetch(`/api/quant/${symbol}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch quant metrics");
        return res.json();
      })
      .then(data => {
        if (data.status === "success") {
          setQuantData(data);
          setActiveSymbol(symbol.toUpperCase());
        } else {
          setError(data.message || "Unknown error");
        }
      })
      .catch(err => {
        setError("Symbol not found or data unavailable.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchQuantData(activeSymbol);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchQuantData(searchInput.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto font-sans bg-black">
      {/* Header & Search Strip */}
      <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 rounded-xl border-zinc-800">
        <div className="flex items-center space-x-3.5">
          <div className="flex flex-col">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-sm font-bold text-zinc-100">{activeSymbol}</span>
              <button
                onClick={handleToggleWatchlist}
                disabled={addingWatchlist}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  inWatchlist
                    ? "bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{inWatchlist ? "In Watchlist" : "Add to Watchlist"}</span>
              </button>
            </div>
            <span className="text-[10px] text-zinc-500 tracking-wide font-medium uppercase mt-0.5">Quantitative Analysis Dashboard</span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Enter Stock Symbol (e.g. NICA)" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-[#10B981] w-full sm:w-64 transition-colors uppercase"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="px-4 py-1.5 bg-[#10B981] hover:bg-[#10B981]/90 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Analyze
          </button>
        </form>
      </Card>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#10B981]" />
          <span>Crunching institutional math models...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-500">
          {error}
        </div>
      ) : quantData ? (
        <div className="flex flex-col space-y-4 flex-1">
          {/* Main Visual Chart */}
          <TimeseriesChart 
            symbol={activeSymbol} 
            price={quantData.trend.current_price} 
            sparkline={quantData.historical_prices || []}
          />

          {/* Institutional Quantitative Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            
            {/* Trend & Direction */}
            <Card className="rounded-xl border-zinc-800 bg-zinc-950">
              <CardHeader className="pb-2 border-b border-zinc-800/50">
                <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-400">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>Trend & Direction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">HMA (20-Day)</span>
                  <span className="text-lg font-bold text-zinc-200 block">{quantData.trend.hma20.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Trend Bias</span>
                  <span className={`text-sm font-bold block mt-1 uppercase ${quantData.trend.trend_status === 'Bullish' ? 'text-[#10B981]' : 'text-red-500'}`}>
                    {quantData.trend.trend_status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Volatility & Bands */}
            <Card className="rounded-xl border-zinc-800 bg-zinc-950">
              <CardHeader className="pb-2 border-b border-zinc-800/50">
                <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-400">
                  <Maximize2 className="w-4 h-4 text-purple-500" />
                  <span>Volatility & Risk</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">ATR (14-Day)</span>
                  <span className="text-lg font-bold text-zinc-200 block">{quantData.volatility.atr14.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Risk Profile</span>
                  <span className="text-sm font-bold text-zinc-400 block mt-1">Normal</span>
                </div>
              </CardContent>
            </Card>

            {/* Volume Dynamics */}
            <Card className="rounded-xl border-zinc-800 bg-zinc-950">
              <CardHeader className="pb-2 border-b border-zinc-800/50">
                <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-400">
                  <BarChart2 className="w-4 h-4 text-emerald-500" />
                  <span>Volume Dynamics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">VWAP</span>
                  <span className="text-lg font-bold text-zinc-200 block">{quantData.volume.vwap.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Latest Volume</span>
                  <span className="text-lg font-bold text-zinc-200 block">{quantData.volume.volume_today.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Market Microstructure */}
            <Card className="rounded-xl border-zinc-800 bg-zinc-950">
              <CardHeader className="pb-2 border-b border-zinc-800/50">
                <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-400">
                  <Hash className="w-4 h-4 text-orange-500" />
                  <span>Microstructure Math</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Body %</span>
                  <span className="text-sm font-bold text-zinc-200 block">{(quantData.microstructure.body_ratio * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Up Wick</span>
                  <span className="text-sm font-bold text-zinc-200 block">{(quantData.microstructure.upper_wick_ratio * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Dn Wick</span>
                  <span className="text-sm font-bold text-zinc-200 block">{(quantData.microstructure.lower_wick_ratio * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Statistical */}
            <Card className="rounded-xl border-zinc-800 bg-zinc-950 md:col-span-2 xl:col-span-2">
              <CardHeader className="pb-2 border-b border-zinc-800/50">
                <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-400">
                  <Percent className="w-4 h-4 text-pink-500" />
                  <span>Statistical & Complexity Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-3 md:grid-cols-6 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Z-Score (20D)</span>
                  <span className={`text-lg font-bold block ${quantData.statistical.z_score > 2 ? 'text-red-500' : quantData.statistical.z_score < -2 ? 'text-[#10B981]' : 'text-zinc-200'}`}>
                    {quantData.statistical.z_score.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Skewness</span>
                  <span className="text-lg font-bold text-zinc-200 block">{quantData.statistical.skewness.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Kurtosis</span>
                  <span className="text-lg font-bold text-zinc-200 block">{quantData.statistical.kurtosis.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Log Return</span>
                  <span className="text-lg font-bold text-zinc-200 block">{(quantData.statistical.log_return_daily * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Fractal D</span>
                  <span className={`text-lg font-bold block ${quantData.statistical.fractal_dimension < 1.3 ? 'text-[#10B981]' : quantData.statistical.fractal_dimension > 1.6 ? 'text-red-500' : 'text-orange-400'}`}>
                    {quantData.statistical.fractal_dimension ? quantData.statistical.fractal_dimension.toFixed(3) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Hurst Exp</span>
                  <span className={`text-lg font-bold block ${quantData.statistical.hurst_exponent > 0.6 ? 'text-[#10B981]' : quantData.statistical.hurst_exponent < 0.4 ? 'text-red-500' : 'text-zinc-200'}`}>
                    {quantData.statistical.hurst_exponent ? quantData.statistical.hurst_exponent.toFixed(3) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Fundamental Strength */}
            {quantData.fundamentals && Object.keys(quantData.fundamentals).length > 0 && (
              <Card className="rounded-xl border-zinc-800 bg-zinc-950 md:col-span-2 xl:col-span-3">
                <CardHeader className="pb-2 border-b border-zinc-800/50">
                  <CardTitle className="flex items-center space-x-2 text-xs font-bold uppercase text-zinc-400">
                    <Briefcase className="w-4 h-4 text-yellow-500" />
                    <span>Fundamental Strength & Valuation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Rating</span>
                    <span className={`text-sm font-bold block mt-1 uppercase ${quantData.fundamentals.financial_strength === 'Strong' ? 'text-[#10B981]' : quantData.fundamentals.financial_strength === 'Weak' ? 'text-red-500' : 'text-yellow-400'}`}>
                      {quantData.fundamentals.financial_strength || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">P/E Ratio</span>
                    <span className="text-lg font-bold text-zinc-200 block">{quantData.fundamentals.pe}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">P/B Ratio</span>
                    <span className="text-lg font-bold text-zinc-200 block">{quantData.fundamentals.pb}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">ROE</span>
                    <span className="text-lg font-bold text-zinc-200 block">{quantData.fundamentals.roe}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Dividend Yield</span>
                    <span className="text-lg font-bold text-zinc-200 block">{quantData.fundamentals.dividend_yield}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">Graham Discount</span>
                    <span className={`text-lg font-bold block ${quantData.fundamentals.graham_discount.includes('-') ? 'text-[#10B981]' : 'text-red-500'}`}>
                      {quantData.fundamentals.graham_discount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">P/E vs Sector</span>
                    <span className={`text-sm font-bold block mt-1 uppercase ${quantData.fundamentals.pe_vs_sector === 'Undervalued' ? 'text-[#10B981]' : quantData.fundamentals.pe_vs_sector === 'Overvalued' ? 'text-red-500' : 'text-zinc-400'}`}>
                      {quantData.fundamentals.pe_vs_sector}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase">P/B vs Sector</span>
                    <span className={`text-sm font-bold block mt-1 uppercase ${quantData.fundamentals.pb_vs_sector === 'Undervalued' ? 'text-[#10B981]' : quantData.fundamentals.pb_vs_sector === 'Overvalued' ? 'text-red-500' : 'text-zinc-400'}`}>
                      {quantData.fundamentals.pb_vs_sector}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      ) : null}
    </div>
  );
}

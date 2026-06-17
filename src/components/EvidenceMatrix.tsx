import { Shield, TrendingUp, TrendingDown, Award, Sparkles } from "lucide-react";

interface EvidenceMatrixProps {
  metrics: {
    symbol: string;
    name: string;
    price: number;
    open: number;
    high52: number;
    low52: number;
    eps: number;
    pe: number;
    nav: number;
    divYield: number;
    sentiment: number; // 0 to 100
  };
  chartPath?: string | null;
}

export default function EvidenceMatrix({ metrics, chartPath }: EvidenceMatrixProps) {
  const isUp = metrics.price >= metrics.open;
  const percentChange = ((metrics.price - metrics.open) / (metrics.open || 1)) * 100;

  const getSectorAvg = (sym: string) => {
    if (sym === "AHPC") return 22.0; // Hydropower
    if (sym === "HDL") return 31.4; // Manufacturing
    return 18.5; // Commercial Banks
  };

  const sectorAvg = getSectorAvg(metrics.symbol);
  
  // Dynamic status evaluation
  const isPeOptimal = metrics.pe > 0 && metrics.pe <= sectorAvg;
  
  const getEpsStatus = (eps: number) => {
    if (eps >= 25.0) return { label: "High Efficiency", color: "text-[#10B981]" };
    if (eps > 0) return { label: "Moderate Efficiency", color: "text-amber-500" };
    return { label: "Negative / High Risk", color: "text-red-400" };
  };

  const getNavStatus = (nav: number) => {
    if (nav >= 150.0) return { label: "Strong Equity", color: "text-[#10B981]" };
    return { label: "Moderate Equity", color: "text-amber-500" };
  };

  const getYieldStatus = (yieldVal: number) => {
    if (yieldVal >= 3.0) return { label: "Optimal Payer", color: "text-[#10B981]" };
    if (yieldVal === 0) return { label: "Zero Payout", color: "text-amber-500" };
    return { label: "Moderate Yield", color: "text-zinc-400" };
  };

  const epsStatus = getEpsStatus(metrics.eps);
  const navStatus = getNavStatus(metrics.nav);
  const yieldStatus = getYieldStatus(metrics.divYield);

  return (
    <div id="evidence-matrix-panel" className="bg-[#09090b] rounded-xl border border-zinc-800/80 p-5 flex flex-col justify-between h-full space-y-4 shadow-sm font-sans">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-zinc-500 font-medium">Stock Overview</span>
          <span className="text-lg font-bold text-zinc-100 mt-1">{metrics.symbol} • {metrics.name}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-[11px] text-[#10B981] font-medium rounded-full flex items-center space-x-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>Real-time</span>
        </div>
      </div>

      {/* Prominent Market Sentiment Bar pulled to the top */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="text-zinc-400 font-medium">AI Sentiment</span>
          <span className={`font-semibold ${metrics.sentiment >= 60 ? 'text-[#10B981]' : metrics.sentiment <= 40 ? 'text-red-400' : 'text-zinc-400'}`}>
            {metrics.sentiment}% Bullish
          </span>
        </div>
        
        {/* Sentiment Track */}
        <div className="relative w-full h-3 bg-zinc-950 border border-zinc-800/80 rounded-full overflow-hidden flex items-center">
          <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-red-500/5" />
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#10B981]/5" />
          
          <div 
            className="absolute h-full w-2 border-r border-[#000]/10 shadow transition-all duration-700 rounded-full"
            style={{
              left: `${metrics.sentiment}%`,
              transform: `translateX(-50%)`,
              backgroundColor: metrics.sentiment >= 60 ? '#10B981' : metrics.sentiment <= 40 ? '#EF4444' : '#71717a'
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
          <span>Bearish</span>
          <span>Neutral</span>
          <span>Bullish</span>
        </div>
      </div>

      {/* Numerical Value Box */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 space-y-3">
        <div className="text-[11px] text-zinc-500 font-medium">Price & Trend</div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl tracking-tight text-white font-bold">
            NPR {metrics.price.toLocaleString()}
          </span>
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-md ${isUp ? 'text-[#10B981] bg-[#10B981]/10' : 'text-red-400 bg-red-950/20'}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
            {isUp ? "+" : ""}{percentChange.toFixed(2)}%
          </span>
        </div>

        {/* 52w technical bounds */}
        <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/40">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
            <span>52W Low: <span className="font-mono text-zinc-350 tab-nums font-normal">{metrics.low52.toLocaleString()}</span></span>
            <span>52W High: <span className="font-mono text-zinc-350 tab-nums font-normal">{metrics.high52.toLocaleString()}</span></span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 relative rounded-full overflow-hidden border border-zinc-850">
            <div 
              className="bg-zinc-500 h-full absolute rounded-full transition-all duration-500"
              style={{
                left: `0%`,
                width: `${Math.max(5, Math.min(95, ((metrics.price - metrics.low52) / (metrics.high52 - metrics.low52 || 1)) * 100))}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* 2x2 Ratio Fundamentals Grid - dynamic color mapping */}
      <div className="space-y-3">
        <div className="text-[11px] text-zinc-500 font-medium">Key Metrics</div>
        <div className="grid grid-cols-2 gap-3">
          {/* P/E cell */}
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block">P/E Ratio</span>
            <span className="text-xl font-bold text-zinc-100 mt-1 block">{metrics.pe || "——"}</span>
            <span className="text-[11px] text-zinc-500 block mt-1">Sector Avg: {sectorAvg}</span>
          </div>

          {/* EPS cell */}
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block">EPS</span>
            <span className="text-xl font-bold text-zinc-100 mt-1 block">{metrics.eps || "——"}</span>
            <span className={`text-[11px] font-medium mt-1 block ${epsStatus.color}`}>
              {epsStatus.label}
            </span>
          </div>

          {/* NAV cell */}
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block">NAV</span>
            <span className="text-xl font-bold text-zinc-100 mt-1 block">{metrics.nav || "——"}</span>
            <span className={`text-[11px] font-medium mt-1 block ${navStatus.color}`}>
              {navStatus.label}
            </span>
          </div>

          {/* DIV YIELD cell */}
          <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
            <span className="text-[11px] text-zinc-500 block">Div Yield</span>
            <span className="text-xl font-bold text-zinc-100 mt-1 block">{metrics.divYield}%</span>
            <span className={`text-[11px] font-medium mt-1 block ${yieldStatus.color}`}>
              {yieldStatus.label}
            </span>
          </div>
        </div>
      </div>

      {/* Generated Technical Chart */}
      {chartPath && (
        <div className="mt-4 border-t border-zinc-800/40 pt-4">
          <div className="text-[11px] text-zinc-500 font-medium mb-3 flex items-center justify-between">
            <span>Technical Chart</span>
            <span className="text-[#10B981] flex items-center bg-[#10B981]/10 px-2 py-0.5 rounded-full text-xs font-semibold"><Sparkles className="w-3.5 h-3.5 mr-1.5"/> Live Generated</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0c0c0e] flex items-center justify-center p-1">
            <img 
              src={chartPath + "?t=" + Date.now()} 
              alt={`Technical Chart for ${metrics.symbol}`} 
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}

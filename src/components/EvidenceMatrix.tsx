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
}

export default function EvidenceMatrix({ metrics }: EvidenceMatrixProps) {
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
          <span className="text-[10px] tracking-wider text-zinc-500 uppercase font-semibold">Asset Valuation Matrix</span>
          <span className="text-base font-bold text-zinc-100 tracking-tight mt-0.5">{metrics.symbol} • {metrics.name}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/85 px-3 py-1 text-[10px] text-[#10B981] font-medium uppercase rounded-full flex items-center space-x-1">
          <Award className="w-3.5 h-3.5" />
          <span>Real-time Feed</span>
        </div>
      </div>

      {/* Prominent Market Sentiment Bar pulled to the top */}
      <div className="bg-[#0c0c0e]/85 border border-zinc-850 p-4.5 rounded-xl space-y-2 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-12 w-12 bg-[#10B981]/5 rounded-bl-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[#10B981]/40" />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span className="uppercase text-zinc-500 font-bold tracking-wider">AI Sentiment Pulse</span>
          <span className={`font-bold font-sans text-xs ${metrics.sentiment >= 60 ? 'text-[#10B981]' : metrics.sentiment <= 40 ? 'text-red-400' : 'text-zinc-400'}`}>
            {metrics.sentiment}% Bullish Outlook
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

        <div className="flex items-center justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-wider">
          <span>Bearish Risk</span>
          <span>Neutral Base</span>
          <span>Bullish Demand</span>
        </div>
      </div>

      {/* Numerical Value Box */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-4 space-y-3.5">
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Last Price & Market Trend</div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-mono tracking-tight text-white font-bold tab-nums">
            NPR {metrics.price.toLocaleString()}
          </span>
          <span className={`inline-flex items-center font-sans text-xs font-semibold px-2 py-0.5 rounded ${isUp ? 'text-[#10B981] bg-[#10B981]/10' : 'text-red-400 bg-red-950/10'}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1 text-[#10B981]" /> : <TrendingDown className="w-3.5 h-3.5 mr-1 text-red-400" />}
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
      <div className="space-y-2.5">
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Comparative Fundamentals</div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* P/E cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${isPeOptimal ? 'border-[#10B981]/30 bg-[#10B981]/2' : 'border-amber-500/25 bg-amber-500/2'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Valuation P/E</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.pe || "——"}</span>
            <span className="text-[9px] text-zinc-500 block mt-1">Ref Sector Avg: {sectorAvg}</span>
            <span className={`text-[9.5px] uppercase block text-right font-bold mt-1 ${isPeOptimal ? 'text-[#10B981]' : 'text-amber-500'}`}>
              {isPeOptimal ? "Value Set" : "Premium Price"}
            </span>
          </div>

          {/* EPS cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${metrics.eps >= 25.0 ? 'border-[#10B981]/30 bg-[#10B981]/2' : metrics.eps > 0 ? 'border-amber-500/25 bg-amber-500/2' : 'border-red-500/25 bg-red-500/2'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Earnings EPS</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.eps || "——"}</span>
            <span className="text-[9px] text-zinc-500 block mt-1">NPR / Annualized</span>
            <span className={`text-[9.5px] uppercase block text-right font-bold mt-1 ${epsStatus.color}`}>
              {epsStatus.label}
            </span>
          </div>

          {/* NAV cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${metrics.nav >= 150.0 ? 'border-[#10B981]/30 bg-[#10B981]/2' : 'border-amber-500/25 bg-amber-500/2'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Asset Value NAV</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.nav || "——"}</span>
            <span className="text-[9px] text-zinc-500 block mt-1">NPR Asset Base</span>
            <span className={`text-[9.5px] uppercase block text-right font-bold mt-1 ${navStatus.color}`}>
              {navStatus.label}
            </span>
          </div>

          {/* DIV YIELD cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${metrics.divYield >= 3.0 ? 'border-[#10B981]/30 bg-[#10B981]/2' : 'border-zinc-800'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Dividend Yield</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.divYield}%</span>
            <span className="text-[9px] text-zinc-500 block mt-1">Annual Yield Stream</span>
            <span className={`text-[9.5px] uppercase block text-right font-bold mt-1 ${yieldStatus.color}`}>
              {yieldStatus.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

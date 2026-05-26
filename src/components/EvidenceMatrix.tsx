import { Shield, TrendingUp, TrendingDown, Info, Award } from "lucide-react";

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

  // Rule mappings for optimal condition bounds
  const peOptimalRef = metrics.pe > 0 && metrics.pe < 20.0;
  const epsOptimalRef = metrics.eps >= 25.0;
  const navOptimalRef = metrics.nav >= 150.0;
  const divYieldOptimalRef = metrics.divYield >= 3.0;

  return (
    <div id="evidence-matrix-panel" className="bg-[#09090b] rounded-xl border border-zinc-800/80 p-5 flex flex-col justify-between h-full space-y-4 shadow-sm font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider text-zinc-500 uppercase font-semibold">Asset Valuation Matrix</span>
          <span className="text-base font-bold text-zinc-100 tracking-tight mt-0.5">{metrics.symbol} • {metrics.name}</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/80 px-3 py-1 text-[10px] text-[#10B981] font-medium uppercase rounded-full flex items-center space-x-1">
          <Award className="w-3.5 h-3.5" />
          <span>Real-time Feed</span>
        </div>
      </div>

      {/* Numerical Value Box */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-4 space-y-3.5">
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Last Price & Market Trend</div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-mono tracking-tight text-white font-bold tab-nums">
            NPR {metrics.price.toLocaleString()}
          </span>
          <span className={`inline-flex items-center font-sans text-xs font-semibold px-2 py-0.5 rounded ${isUp ? 'text-[#10B981] bg-[#10B981]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1 text-[#10B981]" /> : <TrendingDown className="w-3.5 h-3.5 mr-1 text-[#EF4444]" />}
            {isUp ? "+" : ""}{percentChange.toFixed(2)}%
          </span>
        </div>

        {/* 52w technical bounds progress */}
        <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/40">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
            <span>52W Low: <span className="font-mono text-zinc-300 tab-nums font-normal">{metrics.low52}</span></span>
            <span>52W High: <span className="font-mono text-zinc-300 tab-nums font-normal">{metrics.high52}</span></span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 relative rounded-full overflow-hidden border border-zinc-800/10">
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

      {/* 2x2 Ratio Fundamentals Grid */}
      <div className="space-y-2.5">
        <div className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase">Comparative Fundamentals</div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* P/E cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${peOptimalRef ? 'border-[#10B981]/60 bg-[#10B981]/5' : 'border-zinc-800/80'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Valuation P/E</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.pe || "——"}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Ref Sector Avg: 18.5</span>
            {peOptimalRef && (
              <span className="text-[9px] text-[#10B981] uppercase block text-right font-bold mt-0.5">Under Bank Avg</span>
            )}
          </div>

          {/* EPS cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${epsOptimalRef ? 'border-[#10B981]/60 bg-[#10B981]/5' : 'border-zinc-800/80'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Earnings EPS</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.eps || "——"}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">NPR / Annualized</span>
            {epsOptimalRef && (
              <span className="text-[9px] text-[#10B981] uppercase block text-right font-bold mt-0.5">High efficiency</span>
            )}
          </div>

          {/* NAV cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${navOptimalRef ? 'border-[#10B981]/60 bg-[#10B981]/5' : 'border-zinc-800/80'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Asset Value NAV</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.nav || "——"}</span>
            <span className="text-[10px] text-zinc-500 block mt-1">NPR Asset Base</span>
            {navOptimalRef && (
              <span className="text-[9px] text-[#10B981] uppercase block text-right font-bold mt-0.5">Strong equity</span>
            )}
          </div>

          {/* DIV YIELD cell */}
          <div className={`p-3 bg-[#0c0c0e] rounded-lg border transition-all ${divYieldOptimalRef ? 'border-[#10B981]/60 bg-[#10B981]/5' : 'border-zinc-800/80'}`}>
            <span className="text-[9px] text-zinc-500 block uppercase font-semibold">Dividend Yield</span>
            <span className="text-lg font-mono font-bold text-zinc-100 tab-nums block">{metrics.divYield}%</span>
            <span className="text-[10px] text-zinc-500 block mt-1">Annual yield stream</span>
            {divYieldOptimalRef && (
              <span className="text-[9px] text-[#10B981] uppercase block text-right font-bold mt-0.5">Optimal payer</span>
            )}
          </div>
        </div>
      </div>

      {/* Linear Macro Sentiment Gauge */}
      <div className="space-y-1.5 pt-3 border-t border-zinc-800/50">
        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span className="uppercase text-zinc-500 font-semibold">Automated Market Sentiment</span>
          <span className={`font-bold font-mono ${metrics.sentiment >= 60 ? 'text-[#10B981]' : metrics.sentiment <= 40 ? 'text-[#EF4444]' : 'text-zinc-400'}`}>
            {metrics.sentiment}% Bullish Outlook
          </span>
        </div>
        
        {/* Track Slider */}
        <div className="relative w-full h-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden flex items-center">
          {/* Muted background splits */}
          <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#EF4444]/5 border-r border-zinc-800/20" />
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#10B981]/5" />
          
          {/* Sentiment ticker slider pointer node */}
          <div 
            className="absolute h-full w-2 border-r border-[#000]/10 shadow transition-all duration-700 rounded-full"
            style={{
              left: `${metrics.sentiment}%`,
              transform: `translateX(-50%)`,
              backgroundColor: metrics.sentiment >= 60 ? '#10B981' : metrics.sentiment <= 40 ? '#EF4444' : '#71717a'
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[8px] text-zinc-500 font-semibold uppercase">
          <span>Bearish Risk</span>
          <span>Neutral Base</span>
          <span>Bullish Demand</span>
        </div>
      </div>
    </div>
  );
}

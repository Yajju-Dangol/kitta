import { useEffect, useState } from "react";
import { Cpu, ShieldAlert, Wifi } from "lucide-react";

interface TickerItem {
  symbol: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
}

export default function TelemetryStrip() {
  const [tickers, setTickers] = useState<TickerItem[]>([
    { symbol: "NEPSE", value: "2,087.45", delta: "+15.20", trend: "up" },
    { symbol: "Sensitive", value: "392.40", delta: "-1.15", trend: "down" },
    { symbol: "Banking", value: "1,142.10", delta: "+8.45", trend: "up" },
    { symbol: "Hydropower", value: "2,410.60", delta: "-12.50", trend: "down" },
    { symbol: "Insurance", value: "9,820.00", delta: "+142.0", trend: "up" },
    { symbol: "NABIL", value: "1,245.00", delta: "+1.20%", trend: "up" },
    { symbol: "NMB", value: "410.00", delta: "-0.80%", trend: "down" },
    { symbol: "NICA", value: "720.00", delta: "+0.35%", trend: "up" }
  ]);

  useEffect(() => {
    fetch("/api/tickers")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => setTickers(data))
      .catch(() => {});
  }, []);

  return (
    <div id="telemetry-strip" className="h-11 bg-[#09090b] border-b border-zinc-800/80 flex items-center justify-between px-4 overflow-hidden text-xs">
      {/* Marquee area */}
      <div className="flex-1 overflow-hidden relative flex items-center mr-4">
        <div className="flex whitespace-nowrap animate-marquee">
          {/* Repeat tickers twice for seamless loop */}
          {[...tickers, ...tickers].map((t, idx) => (
            <div key={idx} className="inline-flex items-center mx-6 font-sans tracking-tight cursor-default">
              <span className="text-zinc-500 mr-2 uppercase font-semibold">{t.symbol}</span>
              <span className="text-zinc-200 font-mono tab-nums mr-2">{t.value}</span>
              <span className={`font-mono tab-nums font-semibold ${t.trend === 'up' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {t.delta}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Corporate Market Status Badge */}
      <div className="flex items-center space-x-3 border-l border-zinc-800/80 pl-4 flex-shrink-0">
        <div className="flex items-center space-x-1.5 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
          <span className="relative flex h-1.5 w-1.5">
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]"></span>
          </span>
          <span className="text-[9px] font-semibold font-sans tracking-wider text-zinc-400 uppercase">NEPSE LIVE GRID</span>
        </div>
      </div>
    </div>
  );
}

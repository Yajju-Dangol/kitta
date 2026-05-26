import { useState, useEffect } from "react";
import { Stock, AlertRule } from "../types";
import SpreadsheetGrid from "../components/SpreadsheetGrid";
import DrawerSlideOver from "../components/DrawerSlideOver";
import { ShieldCheck, Database, Sliders, AlertTriangle, Cpu } from "lucide-react";

interface WatchlistForgePageProps {
  stocks: Stock[];
  alerts: AlertRule[];
  onTriggerInterrogation: (symbol: string) => void;
  onRefreshAlerts: () => void;
}

export default function WatchlistForgePage({
  stocks,
  alerts,
  onTriggerInterrogation,
  onRefreshAlerts
}: WatchlistForgePageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [targetSymbol, setTargetSymbol] = useState("NABIL");

  const handleEditAlertRules = (symbol: string) => {
    setTargetSymbol(symbol);
    setDrawerOpen(true);
  };

  const handleToggleAlert = (id: string) => {
    fetch(`/api/alerts/toggle/${id}`, { method: "POST" })
      .then((res) => {
        if (res.ok) onRefreshAlerts();
      })
      .catch(() => {});
  };

  const handleDeleteAlert = (id: string) => {
    fetch(`/api/alerts/${id}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) onRefreshAlerts();
      })
      .catch(() => {});
  };

  const handleCommitParameters = (symbol: string, rule: { metric: 'PE' | 'Price' | 'DivYield'; operator: '<' | '>'; value: number }) => {
    fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, ...rule })
    })
      .then((res) => {
        if (res.ok) {
          onRefreshAlerts();
          setDrawerOpen(false);
        }
      })
      .catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col p-4.5 space-y-4 overflow-y-auto">
      {/* Upper landscape table grid spreadsheet */}
      <SpreadsheetGrid
        stocks={stocks}
        alerts={alerts}
        onTriggerInterrogation={onTriggerInterrogation}
        onEditTelemetryRules={handleEditAlertRules}
        onToggleAlert={handleToggleAlert}
        onDeleteAlert={handleDeleteAlert}
        currentSymbol={targetSymbol}
      />

      {/* Expansive Parameter Selection Matrix View on bottom */}
      <div className="bg-[#09090B] border border-[#202024] p-4 space-y-3">
        <div className="flex items-center space-x-2 border-b border-[#202024] pb-2 font-mono">
          <Sliders className="w-4 h-4 text-[#10B981]" />
          <span className="text-[10px] text-zinc-400 font-bold uppercase">EXPANSIVE PARAMETER COMPILER SELECTION MATRIX</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 border border-[#202024] p-3 space-y-1.5">
            <span className="font-mono text-[9px] text-[#10B981] block font-bold uppercase tracking-wide">SYSTEM ALPHA: PRICE TRACER</span>
            <p className="font-sans text-xs text-zinc-400 leading-normal">
              Continuous 5-minute ticks update ticker feeds. Thresholds are optimized to capture sudden downward liquidity departures.
            </p>
          </div>

          <div className="bg-black/30 border border-[#202024] p-3 space-y-1.5">
            <span className="font-mono text-[9px] text-zinc-500 block font-bold uppercase tracking-wide">SYSTEM BETA: VALUATION OVERFLOW</span>
            <p className="font-sans text-xs text-zinc-400 leading-normal">
              P/E indices evaluates against standard banking sector averages of 18.5 points. Accents glowing outlines on matches.
            </p>
          </div>

          <div className="bg-black/30 border border-[#202024] p-3 space-y-1.5">
            <span className="font-mono text-[9px] text-zinc-500 block font-bold uppercase tracking-wide">SYSTEM GAMMA: SCRAPE INTENSITY</span>
            <p className="font-sans text-xs text-zinc-400 leading-normal">
              Polite crawling schedules respect NEPSE official guidelines. Data freshness caches carry a 24-hour expiration duration.
            </p>
          </div>
        </div>
      </div>

      {/* Flyout rules creation drawer */}
      <DrawerSlideOver
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        symbol={targetSymbol}
        onCommitParameters={handleCommitParameters}
      />
    </div>
  );
}

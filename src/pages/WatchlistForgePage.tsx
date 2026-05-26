import { useState } from "react";
import { Stock, AlertRule } from "../types";
import SpreadsheetGrid from "../components/SpreadsheetGrid";
import DrawerSlideOver from "../components/DrawerSlideOver";
import SidecarAssistant from "../components/SidecarAssistant";
import { Sliders, X, ShieldAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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
  const [sidecarOpen, setSidecarOpen] = useState(false);
  const [targetSymbol, setTargetSymbol] = useState("NABIL");

  const handleEditAlertRules = (symbol: string) => {
    setTargetSymbol(symbol);
    setDrawerOpen(true);
  };

  const handleAskAI = (symbol: string) => {
    setTargetSymbol(symbol);
    setSidecarOpen(true);
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

  const activeStock = stocks.find(s => s.symbol === targetSymbol) || stocks[0];

  return (
    <div className="flex-1 flex flex-col p-4.5 space-y-4 overflow-y-auto">
      {/* Upper watchlist table matrix */}
      <SpreadsheetGrid
        stocks={stocks}
        alerts={alerts}
        onTriggerInterrogation={handleAskAI}
        onEditTelemetryRules={handleEditAlertRules}
        onToggleAlert={handleToggleAlert}
        onDeleteAlert={handleDeleteAlert}
        currentSymbol={targetSymbol}
      />

      {/* AI Scanner Settings View on bottom */}
      <div className="bg-[#09090B] border border-zinc-800/80 p-4 rounded-xl space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-zinc-800/50 pb-2 font-sans">
          <Sliders className="w-4 h-4 text-[#10B981]" />
          <span className="text-[10px] text-zinc-400 font-bold uppercase">AI Scanner Settings</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 border border-zinc-800/60 p-3.5 rounded-lg space-y-1.5">
            <span className="font-sans text-[9px] text-[#10B981] block font-bold uppercase tracking-wide">Real-Time Price Monitor</span>
            <p className="font-sans text-xs text-zinc-400 leading-normal">
              Continuously scans NEPSE tickers every 5 minutes. Configured to alert you on sudden price drops or momentum breakouts.
            </p>
          </div>

          <div className="bg-black/30 border border-zinc-800/60 p-3.5 rounded-lg space-y-1.5">
            <span className="font-sans text-[9px] text-zinc-500 block font-bold uppercase tracking-wide">Valuation Scanner</span>
            <p className="font-sans text-xs text-zinc-400 leading-normal">
              Evaluates target P/E ratios against standard sector averages (Banking: 18.5, Hydropower: 22.0) to highlight deep value setups.
            </p>
          </div>

          <div className="bg-black/30 border border-zinc-800/60 p-3.5 rounded-lg space-y-1.5">
            <span className="font-sans text-[9px] text-zinc-500 block font-bold uppercase tracking-wide">Official NEPSE Document Crawler</span>
            <p className="font-sans text-xs text-zinc-400 leading-normal">
              Scans company quarter reports and regulatory notices in real-time. Data freshness caches carry a 24-hour expiration duration.
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

      {/* Slideover for Sidecar Assistant */}
      <AnimatePresence>
        {sidecarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidecarOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#09090B] border-l border-zinc-850 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-black/40">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-semibold tracking-wider font-mono">WORKSPACE ANALYSIS</span>
                  <span className="text-xs font-bold text-zinc-200 uppercase mt-0.5">AI Research Assistant</span>
                </div>
                <button
                  onClick={() => setSidecarOpen(false)}
                  className="text-zinc-500 hover:text-[#EF4444] p-1 border border-zinc-800 hover:border-[#EF4444] bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              {/* Sidecar container */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <SidecarAssistant
                  symbol={targetSymbol}
                  price={activeStock.price}
                  pe={activeStock.pe}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { Stock, AlertRule } from "../types";
import DrawerSlideOver from "../components/DrawerSlideOver";
import { AnimatedAIChat } from "../components/ui/animated-ai-chat";
import { FinancialTable } from "../components/ui/financial-markets-table";
import { X } from "lucide-react";
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

  const handleAskAI = (symbol: string) => {
    setTargetSymbol(symbol);
    setSidecarOpen(true);
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
    <div className="flex-1 flex flex-col p-4.5 space-y-4 overflow-y-auto w-full max-w-full">
      {/* High-Performance Animated Watchlist Matrix */}
      <FinancialTable 
        title="NEPSE Active Watchlist"
        stocks={stocks}
        onStockSelect={handleAskAI}
        className="mt-2"
      />

      {/* Flyout rules creation drawer */}
      <DrawerSlideOver
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        symbol={targetSymbol}
        onCommitParameters={handleCommitParameters}
      />

      {/* Slideover for Sidecar Assistant */}
      <AnimatePresence>
        {sidecarOpen && activeStock && (
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
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-[#09090B] border-l border-[#202024] shadow-2xl z-50 flex flex-col"
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
              <div className="flex-1 min-h-0 overflow-y-auto relative">
                <div className="absolute inset-0 scale-[0.8] origin-top">
                   <AnimatedAIChat />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

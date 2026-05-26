import { useState } from "react";
import { Stock, AlertRule } from "../types";
import { Eye, Settings, PlayCircle, HelpCircle, Activity, ArrowRight, Trash2 } from "lucide-react";

interface SpreadsheetGridProps {
  stocks: Stock[];
  alerts: AlertRule[];
  onTriggerInterrogation: (symbol: string) => void;
  onEditTelemetryRules: (symbol: string) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  currentSymbol: string;
}

export default function SpreadsheetGrid({
  stocks,
  alerts,
  onTriggerInterrogation,
  onEditTelemetryRules,
  onToggleAlert,
  onDeleteAlert,
  currentSymbol
}: SpreadsheetGridProps) {
  const [hoveredRowSymbol, setHoveredRowSymbol] = useState<string | null>(null);

  return (
    <div id="spreadsheet-grid-panel" className="bg-[#09090B] border border-[#202024] p-4 flex flex-col space-y-4">
      {/* Top action layout info */}
      <div className="flex items-center justify-between border-b border-[#202024] pb-2.5">
        <div className="flex items-center space-x-2 font-mono">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <span className="text-[11px] font-bold text-zinc-300 uppercase">ACTIVE GENERAL MONITORING WATCHLIST MATRIX</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 uppercase">[TABULAR METRIC ALIGNMENTS]</span>
      </div>

      {/* Spreadsheet grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="border-b border-[#202024] font-mono text-[10px] text-zinc-500 uppercase tracking-wider bg-black/40">
              <th className="py-2.5 px-3">Asset ID</th>
              <th className="py-2.5 px-3">Company Identity</th>
              <th className="py-2.5 px-3 text-right">Live Metric (Value)</th>
              <th className="py-2.5 px-3 text-right">Inter-Day Delta (%)</th>
              <th className="py-2.5 px-3 text-right">Tracking Ratio (P/E)</th>
              <th className="py-2.5 px-3 text-center">Active Trigger Alerts</th>
              <th className="py-2.5 px-3 text-right relative min-w-[200px]">Telemetry Actions</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isHovered = hoveredRowSymbol === stock.symbol;
              const isUp = stock.price >= stock.open;
              const deltaPercent = ((stock.price - stock.open) / (stock.open || 1)) * 100;
              
              // Get active alerts targeting this symbol
              const stockAlerts = alerts.filter(a => a.symbol === stock.symbol);
              const activeAlert = stockAlerts.find(a => a.active);

              return (
                <tr
                  key={stock.symbol}
                  onMouseEnter={() => setHoveredRowSymbol(stock.symbol)}
                  onMouseLeave={() => setHoveredRowSymbol(null)}
                  className={`border-b border-[#202024]/65 font-mono text-[11.5px] cursor-default transition-all ${
                    isHovered ? 'bg-[#141417]/80' : 'hover:bg-[#141417]/40'
                  }`}
                >
                  {/* Asset ID */}
                  <td className="py-3 px-3 font-semibold text-zinc-100 flex items-center space-x-1.5">
                    <span className="text-[#10B981] font-bold">▪</span>
                    <span>{stock.symbol}</span>
                  </td>

                  {/* Identity */}
                  <td className="py-3 px-3 text-zinc-400 font-sans">{stock.name}</td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right text-zinc-200 font-bold tab-nums">
                    NPR {stock.price.toLocaleString()}
                  </td>

                  {/* Inter-day delta */}
                  <td className="py-3 px-3 text-right tab-nums font-bold">
                    <span className={isUp ? 'text-[#10B981]' : 'text-[#EF4444]'}>
                      {isUp ? '+' : ''}{deltaPercent.toFixed(2)}%
                    </span>
                  </td>

                  {/* PE ratio */}
                  <td className="py-3 px-3 text-right text-zinc-300 tab-nums">
                    {stock.pe.toFixed(1)}
                  </td>

                  {/* Pulse condition alerts tag */}
                  <td className="py-3 px-3 text-center">
                    {activeAlert ? (
                      <span className="inline-flex items-center space-x-1.5 bg-[#10B981]/15 text-[#10B981] px-2 py-0.5 border border-[#10B981]/25 text-[10px] rounded-sm font-bold uppercase animate-pulse">
                        <span className="h-1.5 w-1.5 bg-[#10B981] rounded-full"></span>
                        <span>{activeAlert.metric} {activeAlert.operator} {activeAlert.value}</span>
                      </span>
                    ) : stockAlerts.length > 0 ? (
                      <span className="bg-[#141417] text-zinc-500 border border-[#202024] px-2 py-0.5 text-[9px] rounded-sm font-bold uppercase">
                        INACTIVE
                      </span>
                    ) : (
                      <span className="text-zinc-600 italic">None Enabled</span>
                    )}
                  </td>

                  {/* Telemetry Actions with absolute alignment hovering quick-links */}
                  <td className="py-3 px-3 text-right relative pr-4">
                    {isHovered ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 bg-[#141417] border border-[#202024] p-0.5">
                        <button
                          onClick={() => onTriggerInterrogation(stock.symbol)}
                          className="bg-[#10B981] text-black hover:bg-[#10B981]/80 text-[10px] font-black px-2 py-1 flex items-center space-x-1 uppercase transition-colors"
                        >
                          <span>Execute Interrogation</span>
                          <ArrowRight className="w-3 h-3 text-black" />
                        </button>
                        <button
                          onClick={() => onEditTelemetryRules(stock.symbol)}
                          className="bg-black text-zinc-300 hover:text-white hover:border-[#10B981] text-[10px] border border-[#202024] px-2.5 py-1 flex items-center space-x-1 uppercase transition-all"
                        >
                          <span>Trigger Telemetry Rules</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2 text-zinc-500">
                        <span className="text-[10px] tracking-tight uppercase">[ Hover to Interrogate ]</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Spreadsheet alert parameters details list */}
      {alerts.length > 0 && (
        <div className="pt-4 border-t border-[#202024] space-y-3">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            ACTIVE ALERTS TELEMETRY METRICS CONFIGURATION REGISTER:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 bg-black/40 border flex flex-col justify-between space-y-2 ${
                  alert.active ? 'border-[#10B981] bg-[#10B981]/5' : 'border-[#202024]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold text-zinc-200">{alert.symbol} Trigger rule</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border ${
                    alert.active ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-zinc-500 border-zinc-800'
                  }`}>
                    {alert.tag}
                  </span>
                </div>
                <div className="font-mono text-xs text-zinc-300">
                  Trigger alarm if: <b className="text-zinc-100">{alert.metric} {alert.operator} {alert.value}</b>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#202024]/60">
                  <button 
                    onClick={() => onToggleAlert(alert.id)}
                    className="text-[9px] font-mono hover:text-[#10B981] hover:underline uppercase text-zinc-400"
                  >
                    {alert.active ? 'Disable alarm' : 'Enable alarm'}
                  </button>
                  <button 
                    onClick={() => onDeleteAlert(alert.id)}
                    className="text-[9px] font-mono text-[#EF4444]/80 hover:text-[#EF4444] uppercase inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Purge rule</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

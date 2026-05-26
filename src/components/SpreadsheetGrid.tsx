import { useState } from "react";
import { Stock, AlertRule } from "../types";
import { MessageSquare, Sliders, PlayCircle, HelpCircle, Activity, ArrowRight, Trash2, Bell } from "lucide-react";

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

  const getSectorAvg = (symbol: string) => {
    if (symbol === "AHPC") return 22.0; // Hydropower
    if (symbol === "HDL") return 31.4; // Manufacturing
    return 18.5; // Commercial Banks
  };

  const getPeTag = (pe: number, sectorAvg: number) => {
    return pe > sectorAvg ? "High" : "Value";
  };

  const getSentimentText = (sentiment: number) => {
    if (sentiment >= 60) return "BULLISH";
    if (sentiment <= 40) return "BEARISH";
    return "NEUTRAL";
  };

  const getSentimentBadgeClass = (sentiment: number) => {
    if (sentiment >= 60) return "bg-emerald-950/40 text-[#10B981] border-[#10B981]/30";
    if (sentiment <= 40) return "bg-red-950/40 text-red-400 border-red-800/30";
    return "bg-zinc-900 text-zinc-400 border-zinc-800";
  };

  const getAlertReadableText = (alert: AlertRule) => {
    const op = alert.operator === "<" ? "drops below" : "rises above";
    if (alert.metric === "PE") {
      return `Alert me when P/E ${op} ${alert.value}`;
    }
    if (alert.metric === "Price") {
      return `Alert me when price ${op} NPR ${alert.value.toLocaleString()}`;
    }
    if (alert.metric === "DivYield") {
      return `Alert me when dividend yield is above ${alert.value}%`;
    }
    return `Alert me when ${alert.metric} ${alert.operator} ${alert.value}`;
  };

  return (
    <div id="spreadsheet-grid-panel" className="bg-[#09090B] border border-zinc-800/80 p-5 rounded-xl flex flex-col space-y-4 shadow-sm font-sans">
      
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <span className="text-xs font-bold text-zinc-300 uppercase">My Watchlist</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 uppercase">Interactive Fundamental Radar</span>
      </div>

      {/* Overhauled table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="border-b border-zinc-800/80 font-sans text-[10px] text-zinc-500 uppercase tracking-wider bg-black/40">
              <th className="py-3 px-4">Asset</th>
              <th className="py-3 px-4">Company Identity</th>
              <th className="py-3 px-4 text-right">Live Price (NPR)</th>
              <th className="py-3 px-4 text-right">P/E vs Sector</th>
              <th className="py-3 px-4 text-center">AI Sentiment</th>
              <th className="py-3 px-4 text-right min-w-[210px]">Quick Action</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isUp = stock.price >= stock.open;
              const deltaPercent = ((stock.price - stock.open) / (stock.open || 1)) * 100;
              const sectorAvg = getSectorAvg(stock.symbol);
              const peTag = getPeTag(stock.pe, sectorAvg);
              
              // Alert tags
              const stockAlerts = alerts.filter(a => a.symbol === stock.symbol);
              const activeAlert = stockAlerts.find(a => a.active);

              return (
                <tr
                  key={stock.symbol}
                  className="border-b border-zinc-800/40 text-xs hover:bg-[#141417]/50 transition-colors"
                >
                  {/* Asset */}
                  <td className="py-3.5 px-4 font-mono font-bold text-zinc-100">
                    <span className="text-[#10B981] mr-2">▪</span>
                    {stock.symbol}
                  </td>

                  {/* Company Identity */}
                  <td className="py-3.5 px-4 text-zinc-400 font-sans">{stock.name}</td>

                  {/* Live Price (NPR) */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold tab-nums text-zinc-200">
                    <div className="flex flex-col items-end">
                      <span>NPR {stock.price.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold mt-0.5 ${isUp ? 'text-[#10B981]' : 'text-red-400'}`}>
                        {isUp ? '▲' : '▼'} {deltaPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>

                  {/* P/E vs Sector */}
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-300">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-zinc-100">{stock.pe.toFixed(1)}</span>
                      <span className={`text-[10px] uppercase font-bold mt-0.5 ${peTag === 'Value' ? 'text-[#10B981]' : 'text-zinc-500'}`}>
                        {peTag} (Avg {sectorAvg})
                      </span>
                    </div>
                  </td>

                  {/* AI Sentiment */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${getSentimentBadgeClass(stock.sentiment)}`}>
                      {getSentimentText(stock.sentiment)}
                    </span>
                  </td>

                  {/* Quick Action */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onTriggerInterrogation(stock.symbol)}
                        className="bg-[#10B981] hover:bg-[#10B981]/90 text-black text-[10px] font-bold px-3 py-1.5 rounded-md flex items-center space-x-1 uppercase transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-black" />
                        <span>Ask AI</span>
                      </button>

                      <button
                        onClick={() => onEditTelemetryRules(stock.symbol)}
                        className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] px-2.5 py-1.5 rounded-md flex items-center space-x-1 uppercase transition-all cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Set Alerts</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Alert Manager Section */}
      {alerts.length > 0 && (
        <div className="pt-4 border-t border-zinc-800/60 space-y-3.5">
          <div className="flex items-center space-x-1.5 text-zinc-500 font-semibold tracking-wider text-[10px] uppercase">
            <Bell className="w-3.5 h-3.5 text-zinc-500" />
            <span>Alert Manager</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  alert.active 
                    ? 'border-[#10B981]/50 bg-[#10B981]/5 shadow-[0_0_8px_rgba(16,185,129,0.03)]' 
                    : 'border-zinc-800 bg-zinc-900/30'
                }`}
              >
                <div className="flex items-center justify-between font-sans text-[10.5px]">
                  <span className="font-bold text-zinc-200">{alert.symbol} Price & Fundamental Triggers</span>
                  <span className={`px-2 py-0.5 text-[8.5px] font-bold uppercase rounded-full border ${
                    alert.active ? 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10' : 'text-zinc-500 border-zinc-800 bg-zinc-950'
                  }`}>
                    {alert.active ? 'Active' : 'Muted'}
                  </span>
                </div>

                <div className="font-sans text-xs text-zinc-300 font-medium">
                  {getAlertReadableText(alert)}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
                  <button 
                    onClick={() => onToggleAlert(alert.id)}
                    className="text-[9px] font-semibold hover:text-[#10B981] uppercase text-zinc-400 transition-colors"
                  >
                    {alert.active ? 'Mute Alert' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => onDeleteAlert(alert.id)}
                    className="text-[9px] font-semibold text-red-400/80 hover:text-red-400 uppercase inline-flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Purge</span>
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

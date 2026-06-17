"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { Stock } from "@/types";

interface FinancialTableProps {
  title?: string;
  stocks: Stock[];
  onStockSelect?: (symbol: string) => void;
  className?: string;
}

export function FinancialTable({
  title = "NEPSE Watchlist",
  stocks,
  onStockSelect,
  className = ""
}: FinancialTableProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark" || !theme; // Default to dark for Kitta

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStockSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    if (onStockSelect) {
      onStockSelect(symbol);
    }
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (value: number) => {
    if (!mounted) {
      const isPositive = value >= 0;
      return {
        color: isPositive ? "#10B981" : "#EF4444",
        bgColor: isPositive ? "bg-[#10B981]/10" : "bg-[#EF4444]/10",
        borderColor: isPositive ? "border-[#10B981]/30" : "border-[#EF4444]/30",
        textColor: isPositive ? "text-[#10B981]" : "text-[#EF4444]"
      };
    }
    
    const isPositive = value >= 0;
    const color = isPositive 
      ? (isDark ? "#10B981" : "#059669")
      : (isDark ? "#EF4444" : "#DC2626");
    const bgColor = isPositive 
      ? (isDark ? "bg-[#10B981]/10" : "bg-green-50")
      : (isDark ? "bg-[#EF4444]/10" : "bg-red-50");
    const borderColor = isPositive 
      ? (isDark ? "border-[#10B981]/30" : "border-green-200")
      : (isDark ? "border-[#EF4444]/30" : "border-red-200");
    const textColor = isPositive 
      ? (isDark ? "text-[#10B981]" : "text-green-600")
      : (isDark ? "text-[#EF4444]" : "text-red-600");
    
    return { color, bgColor, borderColor, textColor };
  };

  const getSentimentColor = (sentiment: number) => {
    const isPositive = sentiment >= 50;
    const bgColor = isPositive ? "bg-[#10B981]/10" : "bg-[#EF4444]/10";
    const borderColor = isPositive ? "border-[#10B981]/30" : "border-[#EF4444]/30";
    const textColor = isPositive ? "text-[#10B981]" : "text-[#EF4444]";
    return { bgColor, borderColor, textColor };
  };

  const getCountryFlag = () => {
    // Nepal flag SVG
    return (
      <svg width="32" height="32" viewBox="0 0 512 512" className="scale-125" fill="none">
         <polygon points="50.6,22.4 50.6,489.6 150.3,489.6 150.3,313.2 461.4,313.2 263.3,167.8 440.4,167.8" fill="#DC143C" stroke="#003893" strokeWidth="20" strokeLinejoin="round"/>
         <circle cx="160" cy="110" r="25" fill="#FFFFFF"/>
         <circle cx="160" cy="250" r="35" fill="#FFFFFF"/>
      </svg>
    );
  };

  const renderSparkline = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const createPath = (dataPoints: number[]) => {
      return dataPoints.map((value, index) => {
        const x = (index / (dataPoints.length - 1)) * 60;
        const y = 20 - ((value - min) / range) * 15;
        return `${x},${y}`;
      }).join(' ');
    };

    const fullPath = createPath(data);

    // Kitta neon green
    const strokeColor = "#10B981";

    return (
      <div className="w-16 h-6">
        <motion.svg 
          width="60" 
          height="20" 
          viewBox="0 0 60 20" 
          className="overflow-visible"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            duration: shouldReduceMotion ? 0.2 : 0.5
          }}
        >
          {fullPath && (
            <motion.polyline
              points={fullPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ 
                duration: shouldReduceMotion ? 0.3 : 0.8,
                ease: "easeOut",
                delay: 0.2
              }}
            />
          )}
        </motion.svg>
      </div>
    );
  };

  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    }
  };

  const rowVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.98,
      filter: "blur(4px)" 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
  };

  return (
    <div className={`w-full max-w-7xl mx-auto font-sans ${className}`}>
      {/* Table Container with horizontal scroll */}
      <div className="bg-[#09090b] border border-[#202024] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Table Headers */}
            <div 
              className="px-8 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider bg-[#141417] border-b border-[#202024] text-left"
              style={{
                display: 'grid',
                gridTemplateColumns: '250px 100px minmax(60px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(100px, 1fr)',
                columnGap: '6px'
              }}
            >
              <div style={{ textAlign: 'left' }}>{title}</div>
              <div style={{ textAlign: 'left' }}>AI Sentiment</div>
              <div style={{ textAlign: 'left' }}>P/E Ratio</div>
              <div style={{ textAlign: 'left' }}>Div yield</div>
              <div style={{ textAlign: 'left' }}>EPS</div>
              <div style={{ textAlign: 'left' }}>Volume</div>
              <div style={{ textAlign: 'left' }}>10-day chart</div>
              <div style={{ textAlign: 'left' }}>Price</div>
              <div style={{ textAlign: 'left' }} className="pr-4">Daily performance</div>
            </div>

            {/* Table Rows */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="bg-[#09090b]"
            >
              {stocks.map((stock, indexNum) => {
                const dailyChange = stock.price - stock.open;
                const dailyChangePercent = (dailyChange / stock.open) * 100;

                return (
                  <motion.div key={stock.symbol} variants={rowVariants}>
                    <div
                      className={`px-8 py-4 cursor-pointer group relative transition-all duration-200 ${
                        selectedSymbol === stock.symbol 
                          ? "bg-[#141417] border-b border-[#202024]" 
                          : "hover:bg-[#141417]/50"
                      } ${indexNum < stocks.length - 1 && selectedSymbol !== stock.symbol ? "border-b border-[#202024]/50" : ""}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '250px 100px minmax(60px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr) minmax(80px, 1fr) minmax(80px, 1fr) minmax(120px, 1fr)',
                        columnGap: '6px'
                      }}
                      onClick={() => handleStockSelect(stock.symbol)}
                    >
                  {/* Market Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[#202024] flex items-center justify-center bg-zinc-900 shrink-0">
                      <div className="w-full h-full flex items-center justify-center bg-white p-0.5">
                        {getCountryFlag()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-200 truncate">{stock.symbol} &bull; {stock.name}</div>
                      <div className="text-xs text-zinc-500">{stock.sector}</div>
                    </div>
                  </div>

                  {/* AI Sentiment */}
                  <div className="flex items-center">
                    {(() => {
                      const { bgColor, borderColor, textColor } = getSentimentColor(stock.sentiment);
                      return (
                        <div className={`px-2 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${bgColor} ${borderColor} ${textColor}`}>
                          {stock.sentiment >= 50 ? "BULLISH" : "BEARISH"} {stock.sentiment}%
                        </div>
                      );
                    })()}
                  </div>

                  {/* P/E Ratio */}
                  <div className="flex items-center">
                    <span className="font-semibold text-zinc-300">
                      {stock.pe ? stock.pe.toFixed(1) : "N/A"}
                    </span>
                  </div>

                  {/* Dividend Yield */}
                  <div className="flex items-center">
                    <span className="font-semibold text-orange-400">
                      {formatPercentage(stock.divYield)}
                    </span>
                  </div>

                  {/* EPS */}
                  <div className="flex items-center">
                    <span className="font-semibold text-zinc-300">
                      NPR {stock.eps.toFixed(1)}
                    </span>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center">
                    <span className="font-semibold text-zinc-300">
                      {stock.volume}
                    </span>
                  </div>

                  {/* 10-day Chart */}
                  <div className="flex items-center">
                    <div className="px-2">
                      {renderSparkline(stock.sparkline)}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center">
                    <span className="font-semibold text-zinc-200">
                      {formatCurrency(stock.price)}
                    </span>
                  </div>

                  {/* Daily Performance */}
                  <div className="flex items-center gap-2 pr-4">
                    <span className={`font-semibold ${getPerformanceColor(dailyChange).textColor}`}>
                      {dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(2)}
                    </span>
                    {(() => {
                      const { bgColor, borderColor, textColor } = getPerformanceColor(dailyChangePercent);
                      return (
                        <div className={`px-2 py-1 rounded-md text-xs font-bold border ${bgColor} ${borderColor} ${textColor}`}>
                          {formatPercentage(dailyChangePercent)}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )})}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

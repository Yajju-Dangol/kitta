import React, { useState, useRef } from "react";
import { Activity, Info } from "lucide-react";

interface TimeseriesChartProps {
  symbol: string;
  price: number;
  sparkline: number[];
  selectedEventId?: string | null;
  onSelectEventId?: (eventId: string | null) => void;
}

export default function TimeseriesChart({ 
  symbol, 
  price, 
  sparkline = [1200, 1220, 1195, 1230, 1225, 1215, 1230, 1235, 1240, 1245],
  selectedEventId,
  onSelectEventId
}: TimeseriesChartProps) {
  const [range, setRange] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');
  const [hoveredData, setHoveredData] = useState<{ value: number; percent: number; index: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate responsive price history based on range selection
  const getChartData = () => {
    let base = sparkline;
    if (range === '1W') {
      base = sparkline.map(v => v * (1 + (Math.sin(v) * 0.015)));
    } else if (range === '1M') {
      base = sparkline.map(v => v * (1 - (Math.sin(v) * 0.02) + (Math.cos(v) * 0.01)));
    } else if (range === '1Y') {
      base = sparkline.map(v => v * (1 - (v % 5 === 0 ? 0.08 : -0.05)));
    }

    // Keep active price as the final point
    const pts = [...base];
    pts[pts.length - 1] = price;
    return pts;
  };

  const chartPoints = getChartData();
  const minVal = Math.min(...chartPoints) * 0.995;
  const maxVal = Math.max(...chartPoints) * 1.005;
  const rangeDelta = maxVal - minVal;

  const getEventsForSymbol = (sym: string) => {
    if (sym === "NABIL") {
      return [
        { id: "news_2", index: 6, label: "DIV", title: "Dividend Declared (May 22)" },
        { id: "news_1", index: 8, label: "Q3", title: "Q3 Net Profit +14% (May 24)" }
      ];
    }
    if (sym === "NMB") {
      return [
        { id: "news_3", index: 7, label: "FMO", title: "FMO USD 25M Credit (May 23)" }
      ];
    }
    if (sym === "AHPC") {
      return [
        { id: "news_4", index: 9, label: "TEST", title: "Piluwa Grid Test (May 25)" }
      ];
    }
    return [];
  };

  const events = getEventsForSymbol(symbol);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalPoints = chartPoints.length;
    const widthSegment = rect.width / (totalPoints - 1);
    
    // Find nearest point index
    const index = Math.max(0, Math.min(totalPoints - 1, Math.round(x / widthSegment)));
    const val = chartPoints[index];
    const initialPrice = chartPoints[0];
    const percent = ((val - initialPrice) / initialPrice) * 100;

    setHoveredData({
      value: val,
      percent: percent,
      index: index
    });
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  // Convert price points into SVG coordinates
  const height = 140; // slightly adjusted to account for labels at the top
  const generateSvgPath = (w: number) => {
    const total = chartPoints.length;
    const widthSegment = w / (total - 1);
    
    return chartPoints.map((pt, index) => {
      const x = index * widthSegment;
      const y = height - ((pt - minVal) / (rangeDelta || 1)) * height + 25; // shifted down for header badges
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div ref={containerRef} className="bg-[#0c0c0e] rounded-xl border border-zinc-800/80 p-5 flex flex-col space-y-4 relative w-full h-full min-h-[280px] justify-between shadow-sm font-sans">
      {/* Chart controls */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <span className="text-xs text-zinc-300 font-bold tracking-tight uppercase">Price History Timeline / {symbol}</span>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-805 p-0.5 rounded-lg space-x-1 font-sans text-[10px]">
          {(['1D', '1W', '1M', '1Y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRange(r); setHoveredData(null); }}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${range === r ? 'bg-[#10B981] text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Coordinate HUD overlay */}
      <div className="flex items-baseline justify-between h-10">
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Value Tracker</span>
          <span className="text-[#10B981] text-base font-bold font-mono tab-nums mt-0.5">
            {hoveredData ? `NPR ${hoveredData.value.toFixed(2)} (${hoveredData.percent >= 0 ? '+' : ''}${hoveredData.percent.toFixed(2)}%)` : `LTP: NPR ${price.toLocaleString()}`}
          </span>
        </div>
        <div className="text-right font-sans text-[10px] text-zinc-500">
          Range Target: <span className="font-mono text-zinc-300 font-semibold tab-nums">{minVal.toFixed(0)} - {maxVal.toFixed(0)} NPR</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="h-44 relative flex-1 mt-2 flex items-center justify-center">
        <svg 
          className="w-full h-full overflow-visible select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle horizontal grid lines */}
          <line x1="0" y1="35" x2="100%" y2="35" stroke="#1d1d22" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="85" x2="100%" y2="85" stroke="#1d1d22" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="135" x2="100%" y2="135" stroke="#1d1d22" strokeWidth="1" strokeDasharray="3 3" />

          {/* Core Sparkline Area */}
          <path
            d={generateSvgPath(600)}
            fill="none"
            stroke="#10B981"
            strokeWidth="1.8"
            className="transition-all duration-300"
          />

          {/* AI Event Flags */}
          {events.map((evt) => {
            const total = chartPoints.length;
            const widthSegment = 600 / (total - 1);
            const x = evt.index * widthSegment;
            const ptVal = chartPoints[evt.index] || price;
            const y = height - ((ptVal - minVal) / (rangeDelta || 1)) * height + 25;
            const isSelected = selectedEventId === evt.id;

            return (
              <g key={evt.id} className="cursor-pointer group" onClick={() => onSelectEventId && onSelectEventId(evt.id)}>
                {/* Dotted vertical marker */}
                <line 
                  x1={`${(evt.index / (total - 1)) * 100}%`}
                  y1={y}
                  x2={`${(evt.index / (total - 1)) * 100}%`}
                  y2="100%"
                  stroke={isSelected ? "#10B981" : "#27272a"}
                  strokeWidth={isSelected ? 1.5 : 1}
                  strokeDasharray="2 2"
                  className="transition-colors duration-300"
                />
                
                {/* Pulsing circular node */}
                <circle
                  cx={`${(evt.index / (total - 1)) * 100}%`}
                  cy={y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? "#10B981" : "#0c0c0e"}
                  stroke="#10B981"
                  strokeWidth={isSelected ? 2 : 1.5}
                  className="transition-all duration-300 group-hover:scale-125"
                />
                {isSelected && (
                  <circle
                    cx={`${(evt.index / (total - 1)) * 100}%`}
                    cy={y}
                    r="10"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Small floating label above dot */}
                <foreignObject
                  x={`calc(${(evt.index / (total - 1)) * 100}% - 16px)`}
                  y={y - 22}
                  width="32"
                  height="16"
                  className="overflow-visible"
                >
                  <div className={`px-1 rounded border text-[8.5px] font-bold text-center uppercase shadow-sm select-none transition-all ${
                    isSelected 
                      ? 'bg-[#10B981] text-black border-[#10B981]' 
                      : 'bg-black/90 text-zinc-400 border-zinc-800 group-hover:text-zinc-200 group-hover:border-zinc-700'
                  }`}>
                    {evt.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Hover Crosshair Marker line */}
          {hoveredData && (
            <>
              {/* Vertical line tracer */}
              <line 
                x1={`${(hoveredData.index / (chartPoints.length - 1)) * 100}%`}
                y1="0"
                x2={`${(hoveredData.index / (chartPoints.length - 1)) * 100}%`}
                y2="100%"
                stroke="#2a2a30"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Highlight Circle Node */}
              <circle
                cx={`${(hoveredData.index / (chartPoints.length - 1)) * 100}%`}
                cy={`${height - ((hoveredData.value - minVal) / (rangeDelta || 1)) * height + 25}`}
                r="4.5"
                fill="#10B981"
                stroke="#000000"
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>

        {/* Floating current value bounds indicators */}
        <div className="absolute right-0 top-6 font-mono text-[8px] text-zinc-500 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-zinc-800/80 tab-nums">
          MAX {maxVal.toFixed(1)}
        </div>
        <div className="absolute right-0 bottom-1 font-mono text-[8px] text-zinc-500 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-zinc-800/80 tab-nums">
          MIN {minVal.toFixed(1)}
        </div>
      </div>

      {/* Event selection info footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-sans pt-3 border-t border-zinc-800/50">
        <span className="flex items-center space-x-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
          <span>Click on <b className="text-zinc-400">[AI]</b> flags to appraise timeline events</span>
        </span>
        <span>Source: NEPSE Feed Real-time</span>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

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
  sparkline = [1200, 1220, 1195, 1230, 1225, 1215, 1230, 1235, 1240, 1245]
}: TimeseriesChartProps) {
  const [range, setRange] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');

  // Generate responsive price history based on range selection
  const getChartData = () => {
    // Defensive check: ensure sparkline is a valid array with data
    if (!sparkline || !Array.isArray(sparkline) || sparkline.length === 0) {
      // Return default fallback data
      const fallbackData = [1200, 1220, 1195, 1230, 1225, 1215, 1230, 1235, 1240, price || 1245];
      return fallbackData.map((pt, index) => ({
        index,
        price: pt,
        speculated: null
      }));
    }

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
    if (price > 0 && pts.length > 0) {
      pts[pts.length - 1] = price;
    }
    
    // Convert to recharts format
    const data: any[] = pts.map((pt, index) => ({
      index,
      price: pt,
      speculated: null
    }));

    // Defensive check: ensure data array is not empty
    if (data.length === 0) {
      return [{
        index: 0,
        price: price || 1200,
        speculated: null
      }];
    }

    // Generate speculated trendline points into the future
    const lastPrice = pts[pts.length - 1];
    const firstPrice = pts[0];
    const trend = (lastPrice - firstPrice) / pts.length;
    
    // Connect the last actual point to the first speculated point
    data[data.length - 1].speculated = lastPrice;

    for (let i = 1; i <= Math.min(10, Math.floor(pts.length / 2)); i++) {
      data.push({
        index: data.length,
        price: null,
        speculated: lastPrice + (trend * i * 2) + (Math.sin(i) * (lastPrice * 0.005))
      });
    }

    return data;
  };

  const chartData = getChartData();
  const allPrices = chartData.map(d => d.price).filter(p => p !== null)
    .concat(chartData.map(d => d.speculated).filter(p => p !== null));
    
  const minVal = Math.min(...allPrices) * 0.99;
  const maxVal = Math.max(...allPrices) * 1.01;

  const chartConfig = {
    price: {
      label: "Price",
      color: "#10B981",
    },
    speculated: {
      label: "Speculated",
      color: "#8B5CF6",
    }
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col w-full h-full min-h-[300px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/50">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#10B981]" />
          <CardTitle className="text-xs text-zinc-300 font-bold tracking-tight uppercase">Price History / {symbol}</CardTitle>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg space-x-1 font-sans text-[10px]">
          {(['1D', '1W', '1M', '1Y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${range === r ? 'bg-[#10B981] text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col justify-end relative">
        <div className="px-5 pt-4 flex items-baseline justify-between h-10">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Value Tracker</span>
            <span className="text-[#10B981] text-base font-bold font-mono tab-nums mt-0.5">
              LTP: NPR {price.toLocaleString()}
            </span>
          </div>
          <div className="text-right font-sans text-[10px] text-zinc-500">
            Range Target: <span className="font-mono text-zinc-300 font-semibold tab-nums">{minVal.toFixed(0)} - {maxVal.toFixed(0)} NPR</span>
          </div>
        </div>

        <div className="h-[200px] w-full px-2 mt-4">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="index" hide />
                  <YAxis domain={[minVal, maxVal]} hide />
                  <ChartTooltip 
                    cursor={{ stroke: '#27272a', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={<ChartTooltipContent indicator="dot" hideLabel />} 
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-price)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#10B981", stroke: "#000000", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="speculated"
                    stroke="var(--color-speculated)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

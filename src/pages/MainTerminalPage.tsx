import { useState, useEffect } from "react";
import { Stock, NewsItem, TraceLine } from "../types";
import TraceConsole from "../components/TraceConsole";
import NarrativeOutput from "../components/NarrativeOutput";
import EvidenceMatrix from "../components/EvidenceMatrix";
import { Search, Flame, Database, History, HelpCircle, LayoutGrid } from "lucide-react";

interface MainTerminalPageProps {
  stocks: Stock[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onNavigateToDrillDown: () => void;
  prefilledPrompt?: string;
  onClearPrefilledPrompt?: () => void;
}

export default function MainTerminalPage({
  stocks,
  selectedSymbol,
  onSelectSymbol,
  onNavigateToDrillDown,
  prefilledPrompt,
  onClearPrefilledPrompt
}: MainTerminalPageProps) {
  const [queryInput, setQueryInput] = useState("");
  const [traces, setTraces] = useState<TraceLine[]>([]);
  const [narrativeText, setNarrativeText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isLowLatencyIngesting, setIsLowLatencyIngesting] = useState(false); //Slow pulse ember trigger state
  const [chartPath, setChartPath] = useState<string | null>(null);
  
  const activeStock = stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];

  useEffect(() => {
    if (prefilledPrompt) {
      setQueryInput(prefilledPrompt);
      handleExecuteQuery(prefilledPrompt);
      if (onClearPrefilledPrompt) onClearPrefilledPrompt();
    }
  }, [prefilledPrompt]);

  const handleExecuteQuery = (customPrompt?: string) => {
    const activeTextQuery = customPrompt || queryInput;
    if (!activeTextQuery.trim()) return;

    // Save prompt to history
    if (!history.includes(activeTextQuery)) {
      setHistory((prev) => [activeTextQuery, ...prev].slice(0, 5));
    }

    // Reset output and enter ingesting loader states
    setNarrativeText("");
    setIsStreaming(true);
    
    // Check if query is cached (meaning we've run it recently)
    // Toggles isLowLatencyIngesting (slow pulse ember border warning) if simulating missed cash ingestion (>500ms)
    const isCachedKey = activeTextQuery.toLowerCase().includes("nabil") && history.length > 0;
    if (!isCachedKey) {
      setIsLowLatencyIngesting(true); // Slow pulse ember borders
    }

    const startTimestamp = new Date().toISOString();
    
    // Boot diagnostic logging traces sequentially
    const traceLines: TraceLine[] = [
      {
        id: "tr_init",
        text: `▸ Initializing terminal interrogation: "${activeTextQuery}"`,
        status: "info",
        timestamp: startTimestamp
      }
    ];
    setTraces(traceLines);

    // Sequence realistic terminal trace lines matching User Flow 1
    setTimeout(() => {
      setTraces((prev) => [
        ...prev,
        {
          id: "tr_cache",
          text: isCachedKey 
            ? "▸ [Cache Hit: System State Synchronized in 42ms]" 
            : "▸ [Cache Miss: Triggering on-demand NEPSE live scrapers...]",
          status: isCachedKey ? "success" : "warning",
          timestamp: new Date().toISOString()
        }
      ]);
    }, 200);

    setTimeout(() => {
      setTraces((prev) => [
        ...prev,
        {
          id: "tr_fetch",
          text: `▸ [Ingestion] Querying stock fundamentals, closing lists & ratios for target index: ${selectedSymbol}`,
          status: "info",
          timestamp: new Date().toISOString()
        }
      ]);
    }, 450);

    // Call server API
    fetch("/api/interrogate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: activeTextQuery,
        symbol: selectedSymbol
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setIsLowLatencyIngesting(false);
        setNarrativeText(data.analysis);
        
        if (data.traces && data.traces.length > 0) {
          setTraces(data.traces);
        } else {
          setTraces((prev) => [
            ...prev,
            {
              id: "tr_fin",
              text: "▸ [Success] Appraisal models computed. Fading matrix elements onto workspace.",
              status: "success",
              timestamp: new Date().toISOString()
            }
          ]);
        }
        
        if (data.chart_path) {
           setChartPath(data.chart_path);
        }
        
        if (data.symbol && data.symbol !== "NEPSE") {
          onSelectSymbol(data.symbol);
        }
      })
      .catch(() => {
        setTimeout(() => {
          setTraces((prev) => [
            ...prev,
            {
              id: "tr_err",
              text: "▸ [Failure] API Gateway lookup failed. Standard offline models applied.",
              status: "error",
              timestamp: new Date().toISOString()
            }
          ]);
          setIsLowLatencyIngesting(false);
          setNarrativeText(`### Kitta Stock Appraisal Report: **${activeStock?.symbol}**

Warning: The terminal is evaluating metrics inside sandboxed simulation offline models.

- **Current Evaluation**: The stock index is priced at **NPR ${activeStock?.price}**.
- **Metrics Analysis**: Current PE stands at **${activeStock?.pe}** versus macro banking index benchmarks of 18.5 points.

We suggest reviewing comparative lists in the Watchlist Forge panel before executing secondary commits.
`);
        }, 800);
      });
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto font-sans">
      {/* Search Console area */}
      <div 
        className={`bg-[#09090b] rounded-xl border transition-all duration-500 p-5 relative ${
          isLowLatencyIngesting 
            ? 'border-[#10B981]/55 ring-2 ring-[#10B981]/5 shadow-[0_0_12px_rgba(16,185,129,0.06)]' 
            : 'border-zinc-800 focus-within:border-[#10B981]/80 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3 bg-zinc-950 border border-zinc-800 rounded-lg focus-within:border-[#10B981]/60 px-4 py-2.5 transition-all">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleExecuteQuery(); }}
            placeholder="Search & analyze any NEPSE equity valuation... (e.g. 'Is NABIL Bank a value buy?')"
            className="w-full bg-transparent border-none outline-none font-sans text-xs text-zinc-100 placeholder-zinc-500 focus:ring-0 focus:outline-none"
          />
          <button 
            onClick={() => handleExecuteQuery()}
            className="bg-[#10B981] text-black hover:bg-[#10B981]/80 font-sans text-[11px] font-bold px-4 py-2 rounded-md transition-colors cursor-pointer"
          >
            Analyze
          </button>
        </div>

        {/* Search quick prompts */}
        <div className="flex flex-wrap items-center gap-2.5 mt-3 font-sans text-xs text-zinc-500">
          <span className="text-zinc-400 font-semibold flex items-center space-x-1 flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Suggested Topics:</span>
          </span>
          {["Is NABIL Bank a good buy?", "Analyze NMB Bank", "AHPC Technical assessment"].map((p, idx) => (
            <button
              key={idx}
              onClick={() => { setQueryInput(p); handleExecuteQuery(p); }}
              className="bg-zinc-900/60 border border-zinc-805/40 hover:border-[#10B981]/40 px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-200 transition-all text-[11px]"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time tracing stream logs console */}
      <TraceConsole traces={traces} />

      {/* Bifurcated dual workspace split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 flex-1">
        {/* Left narrative block */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <NarrativeOutput
            text={narrativeText}
            isStreaming={isStreaming}
            history={history}
            onSelectHistory={(txt) => { setQueryInput(txt); handleExecuteQuery(txt); }}
          />
        </div>

        {/* Right numerical evidence data matrix */}
        <div className="lg:col-span-4 flex flex-col">
          <EvidenceMatrix metrics={activeStock} chartPath={chartPath} />
          
          {/* Transition button to Drilldown Page */}
          <button
            onClick={onNavigateToDrillDown}
            className="w-full mt-4 py-3 rounded-lg border border-zinc-800 hover:border-[#10B981]/60 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-300 hover:text-white font-sans text-xs font-semibold tracking-wide flex items-center justify-center space-x-2.5 transition-all cursor-pointer select-none shadow-sm"
          >
            <span>Explore Comprehensive Financial Dashboard</span>
            <LayoutGrid className="w-4 h-4 text-[#10B981]" />
          </button>
        </div>
      </div>
    </div>
  );
}

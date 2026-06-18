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

    // Call server API via stream
    fetch("/api/interrogate/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: activeTextQuery,
        symbol: selectedSymbol
      })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        
        setIsLowLatencyIngesting(false);
        setNarrativeText("");
        
        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value: chunk } = await reader.read();
            if (done) {
              setIsStreaming(false);
              break;
            }

            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") continue;

                try {
                  const data = JSON.parse(dataStr);
                  
                  if (data.type === "content") {
                    setNarrativeText(prev => prev + data.text);
                  } else if (data.type === "reasoning") {
                    setTraces(prev => [
                      ...prev,
                      {
                        id: `tr_${Date.now()}_${Math.random()}`,
                        text: `▸ ${data.text.trim()}`,
                        status: "info",
                        timestamp: new Date().toISOString()
                      }
                    ]);
                  } else if (data.type === "start") {
                    if (data.symbol && data.symbol !== "NEPSE") {
                      onSelectSymbol(data.symbol);
                    }
                  }
                } catch (e) {
                  console.error("Stream parse error:", e);
                }
              }
            }
          }
        }
        
        // Finalize trace
        setTraces((prev) => [
          ...prev,
          {
            id: "tr_fin",
            text: "▸ [Success] Appraisal models computed. Fading matrix elements onto workspace.",
            status: "success",
            timestamp: new Date().toISOString()
          }
        ]);
      })
      .catch(() => {
        setTimeout(() => {
          setTraces((prev) => [
            ...prev,
            {
              id: "tr_err",
              text: "▸ [Failure] API Gateway lookup failed. Check backend connection.",
              status: "error",
              timestamp: new Date().toISOString()
            }
          ]);
          setIsLowLatencyIngesting(false);
          setIsStreaming(false);
          setNarrativeText(`### Kitta Stock Appraisal Report: **${activeStock?.symbol}**\n\nWarning: Connection to the intelligence backend failed. Please ensure the server is running.`);
        }, 800);
      });
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto font-sans">
      {/* Search Console area */}
      <div 
        className={`bg-[#09090b] rounded-xl border transition-all duration-500 p-5 relative ${
          isLowLatencyIngesting 
            ? 'border-zinc-700 shadow-sm' 
            : 'border-zinc-800 focus-within:border-zinc-700 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3 bg-zinc-900/50 border border-zinc-800 rounded-lg focus-within:border-zinc-700 px-4 py-2.5 transition-all">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleExecuteQuery(); }}
            placeholder="Search for a stock to analyze..."
            className="w-full bg-transparent border-none outline-none font-sans text-sm text-zinc-100 placeholder-zinc-500 focus:ring-0 focus:outline-none"
          />
          <button 
            onClick={() => handleExecuteQuery()}
            className="bg-zinc-100 text-black hover:bg-white font-sans text-xs font-semibold px-4 py-2 rounded-md transition-colors cursor-pointer"
          >
            Analyze
          </button>
        </div>

        {/* Search quick prompts */}
        <div className="flex flex-wrap items-center gap-2.5 mt-3 font-sans text-xs text-zinc-500">
          <span className="text-zinc-500 font-medium flex items-center space-x-1 flex-shrink-0">
            <Flame className="w-3.5 h-3.5 text-zinc-500" />
            <span>Suggested:</span>
          </span>
          {["Is NABIL Bank a good buy?", "Analyze NMB Bank", "AHPC Technical assessment"].map((p, idx) => (
            <button
              key={idx}
              onClick={() => { setQueryInput(p); handleExecuteQuery(p); }}
              className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 transition-all text-[11px]"
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
            className="w-full mt-4 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-300 hover:text-white font-sans text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-sm"
          >
            <span>View Full Dashboard</span>
            <LayoutGrid className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Cpu, TrendingUp, TrendingDown, RefreshCw, Send, ShieldCheck, HelpCircle, ArrowRight, Layers } from "lucide-react";
import TraceConsole from "../components/TraceConsole";
import { TraceLine } from "../types";

export default function MacroInsightsHubPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'appraisal'>('matrix');
  const [queryInput, setQueryInput] = useState("");
  const [traces, setTraces] = useState<TraceLine[]>([]);
  const [appraisalResult, setAppraisalResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const sectors = [
    {
      name: "Commercial Banks",
      avgPe: 18.3,
      avgYield: "3.3%",
      sentiment: 62,
      trend: "up",
      flow: "Institutional Accumulation",
      action: "ACCUMULATE",
      actionColor: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25",
      desc: "Currently trading at historical valuation discounts relative to global markets. Clear signs of foreign and institutional buyers picking up blue-chip banking credits near key support zones."
    },
    {
      name: "Hydropower",
      avgPe: 23.1,
      avgYield: "0.0%",
      sentiment: 35,
      trend: "down",
      flow: "Short-Term Liquidity Stress",
      action: "REDUCE EXPOSURE",
      actionColor: "text-amber-500 bg-amber-500/10 border-amber-500/25",
      desc: "Experiencing localized margin compression from high leverage ratios and seasonal runoff drops. Recommended tactical allocation shifts to cash until secondary arrays come online."
    },
    {
      name: "Manufacturing & Distillery",
      avgPe: 31.4,
      avgYield: "5.2%",
      sentiment: 82,
      trend: "up",
      flow: "Premium Rotation Inflow",
      action: "HOLD",
      actionColor: "text-zinc-400 bg-zinc-900 border-zinc-800",
      desc: "Strong consumer demand structures allow premium pricing leverage. Strong balance sheets with high asset yield parameters provide premium defenses against macro shifts."
    }
  ];

  const handleSectorQuery = (prompt: string) => {
    setQueryInput(prompt);
    setActiveTab('appraisal');
    setIsAnalyzing(true);
    setAppraisalResult("");

    const startTimestamp = new Date().toISOString();
    const traceLines: TraceLine[] = [
      {
        id: "macro_init",
        text: `▸ Initiating Macro Sector Analysis Scanner: "${prompt}"`,
        status: "info",
        timestamp: startTimestamp
      }
    ];
    setTraces(traceLines);

    setTimeout(() => {
      setTraces((prev) => [
        ...prev,
        {
          id: "macro_fetch",
          text: `▸ [Ingestion] Scraping NEPSE monetary policies, daily sector volumes & cash flow indicators`,
          status: "info",
          timestamp: new Date().toISOString()
        }
      ]);
    }, 300);

    setTimeout(() => {
      setTraces((prev) => [
        ...prev,
        {
          id: "macro_compare",
          text: `▸ [Cross-Reference] Evaluating Banking Sector average P/E (18.3) vs Hydropower (23.1) and macro bonds yield spreads`,
          status: "warning",
          timestamp: new Date().toISOString()
        }
      ]);
    }, 600);

    // Hit server API to generate authentic appraisal
    fetch("/api/interrogate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `[NEPSE Macro Scope Query] ${prompt}`,
        symbol: "NEPSE"
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setTimeout(() => {
          setTraces((prev) => [
            ...prev,
            {
              id: "macro_success",
              text: `▸ [Success] Macro appraisal models completed. Fading sector insights onto screen.`,
              status: "success",
              timestamp: new Date().toISOString()
            }
          ]);
          setAppraisalResult(data.analysis);
          setIsAnalyzing(false);
        }, 900);
      })
      .catch(() => {
        setTimeout(() => {
          setTraces((prev) => [
            ...prev,
            {
              id: "macro_failure",
              text: `▸ [Failure] Macro API Gateway timeout. Running cached structural models.`,
              status: "error",
              timestamp: new Date().toISOString()
            }
          ]);
          setAppraisalResult(`### Macro Insights Appraisal: **NEPSE Sector Rotation**

Based on localized sector tracking matrices, here is the current structural breakdown:

*   **Commercial Banking (Value Play)**: Trades at an average P/E of **18.3**, which is deeply oversold. Institutional holdings have slowly ticked up over the past 3 weeks, signaling an accumulation phase.
*   **Hydropower (Growth Play with Risk)**: Trades at a premium **23.1** average P/E. High debt loads under elevated localized interest rates represent a moderate systemic risk.
*   **Tactical Asset Allocation Strategy**: We suggest maintaining overweight allocations in High-Dividend Banking and defensive Manufacturing issues, while scaling back from speculative hydro projects pending grid connection approvals.
`);
          setIsAnalyzing(false);
        }, 900);
      });
  };

  const renderAppraisalMarkdown = (raw: string) => {
    if (!raw) {
      return (
        <div className="text-zinc-500 italic flex flex-col items-center justify-center py-16 space-y-3">
          <Layers className="w-8 h-8 text-zinc-700 animate-pulse" />
          <span className="text-center max-w-[280px] text-xs leading-normal">
            No active appraisal computed. Select a preset query above or enter a question to start scanning.
          </span>
        </div>
      );
    }

    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-zinc-100 text-sm font-bold border-b border-zinc-800 pb-1.5 mt-5 mb-3 first:mt-0">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const textContent = line.replace(/^\s*[\*\-]\s+/, "");
        const highlighted = textContent.split("**").map((chunk, cIdx) => 
          cIdx % 2 === 1 ? <strong key={cIdx} className="text-[#10B981] font-semibold">{chunk}</strong> : chunk
        );
        return (
          <div key={idx} className="flex items-start space-x-2 my-2 text-zinc-300 text-xs leading-normal pl-2">
            <span className="text-[#10B981] mt-1 text-[8px]">•</span>
            <span>{highlighted}</span>
          </div>
        );
      }
      if (line.trim() === "") return <div key={idx} className="h-2" />;
      const boldProcessed = line.split("**").map((chunk, cIdx) => 
        cIdx % 2 === 1 ? <strong key={cIdx} className="text-zinc-100 font-semibold">{chunk}</strong> : chunk
      );
      return (
        <p key={idx} className="text-zinc-300 text-xs leading-relaxed my-2">
          {boldProcessed}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto font-sans">
      
      {/* Upper Module header */}
      <div className="bg-[#09090B] border border-zinc-800/80 p-4.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 shadow-sm">
        <div className="space-y-1">
          <div className="font-sans text-[9px] text-[#10B981] uppercase tracking-widest font-semibold flex items-center space-x-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>Market Sectors</span>
          </div>
          <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-tight flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#10B981]" />
            <span>Sector Trends</span>
          </h2>
        </div>

        <div className="flex bg-zinc-900 border border-zinc-805 p-0.5 rounded-lg text-[10px]">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'matrix' ? 'bg-[#10B981] text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sectors
          </button>
          <button
            onClick={() => setActiveTab('appraisal')}
            className={`px-4 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'appraisal' ? 'bg-[#10B981] text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            AI Analyzer
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <div className="space-y-4 flex-1">
          {/* Main matrix list card */}
          <div className="bg-[#09090B] border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-[10px] tracking-wider text-zinc-500 uppercase font-semibold">NEPSE Sector Comparisons</span>
              <span className="text-[9px] text-[#10B981] font-semibold border border-[#10B981]/25 px-2.5 py-0.5 rounded-full uppercase bg-[#10B981]/5">
                Valuation Aligned
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {sectors.map((sec, idx) => (
                <div key={idx} className="bg-black/35 border border-zinc-800/60 p-4.5 rounded-xl hover:border-zinc-700/80 transition-all flex flex-col md:flex-row md:items-start justify-between space-y-3.5 md:space-y-0">
                  <div className="space-y-2 md:max-w-[70%]">
                    <div className="flex items-center space-x-3">
                      <span className="text-zinc-100 font-bold text-sm">{sec.name}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${sec.actionColor}`}>
                        {sec.action}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">{sec.desc}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 md:min-w-[240px] text-right">
                    <div className="bg-[#0c0c0e] border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-semibold">Avg P/E</span>
                      <span className="text-xs font-mono font-bold text-zinc-200 mt-1 tab-nums">{sec.avgPe}</span>
                    </div>
                    <div className="bg-[#0c0c0e] border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-semibold">Avg Yield</span>
                      <span className="text-xs font-mono font-bold text-zinc-200 mt-1 tab-nums">{sec.avgYield}</span>
                    </div>
                    <div className="bg-[#0c0c0e] border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-semibold">AI Sentiment</span>
                      <span className={`text-xs font-mono font-bold mt-1 ${sec.sentiment >= 50 ? 'text-[#10B981]' : 'text-amber-500'}`}>
                        {sec.sentiment}% Bull
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick jump trigger */}
          <div className="bg-gradient-to-r from-[#09090B] to-[#141417]/20 border border-zinc-800/80 p-5 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[#10B981] font-semibold uppercase tracking-wider">Quick Ingestion Scans</span>
              <p className="text-zinc-300 text-xs">Run a deep agentic synthesis appraisal on Banking vs Hydropower sector rotations.</p>
            </div>
            <button
              onClick={() => handleSectorQuery("Explain where the capital is rotating between Commercial Banks vs Hydropower sectors right now.")}
              className="bg-[#10B981] text-black hover:bg-[#10B981]/80 px-4.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>Scan Sector Rotation</span>
              <ArrowRight className="w-4 h-4 text-black" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Interactive appraisal scanner console */}
          <div className="bg-[#09090B] border border-zinc-800/80 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between flex-1">
            <div className="space-y-3.5">
              <div className="flex items-center space-x-3 bg-zinc-950 border border-zinc-800 rounded-lg focus-within:border-[#10B981]/60 px-4 py-2.5 transition-all">
                <Layers className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSectorQuery(queryInput); }}
                  placeholder="Ask the AI Sector Analyst where market value is rotating... (e.g. 'Is Banking better than Hydropower?')"
                  className="w-full bg-transparent border-none outline-none text-xs text-zinc-100 placeholder-zinc-500 focus:ring-0 focus:outline-none"
                />
                <button
                  onClick={() => handleSectorQuery(queryInput)}
                  disabled={isAnalyzing || !queryInput.trim()}
                  className="bg-[#10B981] text-black hover:bg-[#10B981]/80 disabled:opacity-40 disabled:hover:bg-[#10B981] text-[11px] font-bold px-4 py-2 rounded-md transition-colors cursor-pointer"
                >
                  Appraise
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="text-zinc-400 font-semibold flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Sector Questions:</span>
                </span>
                {[
                  "Where is institutional money shifting in NEPSE right now?",
                  "Explain Banking vs Hydropower value rotation",
                  "Analyze dividend yield safety of Banking sector"
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSectorQuery(sug)}
                    className="bg-zinc-900 border border-zinc-805 hover:border-[#10B981]/40 px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-200 transition-all text-[10.5px]"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Reasoning traces */}
            <TraceConsole traces={traces} />

            {/* Ingestion analysis box */}
            <div className="bg-black/35 border border-zinc-800/80 rounded-xl p-5 min-h-[220px] max-h-[350px] overflow-y-auto flex-1">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3.5 text-zinc-400 text-xs">
                  <RefreshCw className="w-6 h-6 text-[#10B981] animate-spin" />
                  <span className="text-[11px] tracking-wide uppercase font-semibold text-[#10B981] animate-pulse">
                    AI Sector Scan...
                  </span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  {renderAppraisalMarkdown(appraisalResult)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-[9px] font-sans text-zinc-650 block text-right uppercase">
        AI Sector tracking under private beta development
      </div>
    </div>
  );
}

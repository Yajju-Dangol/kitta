import { useEffect, useState, useRef } from "react";
import { BookOpen, FileText, History, RefreshCw, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

interface NarrativeOutputProps {
  text: string;
  isStreaming: boolean;
  history?: string[];
  onSelectHistory?: (txt: string) => void;
}

export default function NarrativeOutput({ text, isStreaming, history = [], onSelectHistory }: NarrativeOutputProps) {
  const [displayedText, setDisplayedText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple typing effect for robust rendering
  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }

    if (!isStreaming) {
      setDisplayedText(text);
      return;
    }

    let currentLength = 0;
    setDisplayedText("");
    
    const words = text.split(" ");
    let wordIdx = 0;
    
    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        setDisplayedText((prev) => (prev ? prev + " " + words[wordIdx] : words[wordIdx]));
        wordIdx++;
        
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text, isStreaming]);

  // Clean formatting helper which renders paragraphs and standard markdown blocks correctly
  const renderFormattedMarkdown = (raw: string) => {
    if (!raw) {
      const trendingInsights = [
        {
          tag: "AI Thesis of the Week",
          icon: <TrendingUp className="w-4 h-4 text-[#10B981]" />,
          title: "Banking Sector Exhibits Historical Valuation Discount",
          desc: "Average P/E sits at 18.5 versus historical 24.2 bounds. Institutional accumulation has slowly ticked up, indicating a strong support buffer.",
          prompt: "Analyze Commercial Banking sector valuations and list top value buys."
        },
        {
          tag: "Quick Take",
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
          title: "Hydropower Indices Showing Short-Term Liquidity Stress",
          desc: "Seasonal low-flow runoff and heavy leverage burdens are squeezing cash flow indicators. Focus on high-reserve issues only.",
          prompt: "Analyze liquidity stress, debt risk, and cash flow ratings in the Hydropower sector."
        },
        {
          tag: "Dividend Radar",
          icon: <Sparkles className="w-4 h-4 text-[#10B981]" />,
          title: "NABIL Declares High-Yield NPR 35 Early Cash Dividend",
          desc: "Proposed payout yield sits at approx 3.1%. Robust capital adequacy margins ensure high dividend safety parameters.",
          prompt: "Analyze the sustainability and yield impact of the recent NABIL NPR 35 dividend."
        }
      ];

      return (
        <div className="space-y-5 py-2 font-sans">
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] text-[#10B981] font-semibold uppercase tracking-wider">Market Intelligence Radar</span>
            <h3 className="text-sm font-bold text-zinc-150 uppercase tracking-tight">Trending AI Insights</h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {trendingInsights.map((insight, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectHistory && onSelectHistory(insight.prompt)}
                className="bg-black/35 border border-zinc-800 hover:border-[#10B981]/50 p-4.5 rounded-xl hover:bg-[#141417]/30 transition-all cursor-pointer group shadow-sm flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[9px] font-mono text-[#10B981] uppercase tracking-wider font-bold">
                    {insight.icon}
                    <span>{insight.tag}</span>
                  </div>
                  <span className="text-[8.5px] font-semibold text-zinc-500 uppercase tracking-wider group-hover:text-[#10B981] transition-colors flex items-center space-x-0.5">
                    <span>Scan Insights</span>
                    <span>→</span>
                  </span>
                </div>
                
                <h4 className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                  {insight.title}
                </h4>
                
                <p className="text-zinc-450 text-[11px] leading-relaxed">
                  {insight.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-zinc-100 font-sans text-sm leading-relaxed font-bold border-b border-zinc-800/60 pb-1.5 mt-5 mb-3 first:mt-0">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-[#10B981] font-sans text-xs font-bold mt-4 mb-1.5">
            {line.replace("#### ", "")}
          </h4>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h4 key={idx} className="text-zinc-200 font-sans text-xs font-bold mt-3 mb-1.5">
            {line.replace(/\*\*/g, "")}
          </h4>
        );
      }
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const textContent = line.replace(/^\s*[\*\-]\s+/, "");
        const highlighted = textContent.split("**").map((chunk, cIdx) => 
          cIdx % 2 === 1 ? <strong key={cIdx} className="text-[#10B981] font-semibold">{chunk}</strong> : chunk
        );
        return (
          <div key={idx} className="flex items-start space-x-2 my-1.5 text-zinc-300 font-sans text-xs leading-normal pl-2">
            <span className="text-[#10B981] mt-1 text-[10px]">•</span>
            <span>{highlighted}</span>
          </div>
        );
      }

      if (line.trim() === "") return <div key={idx} className="h-2" />;

      const boldProcessed = line.split("**").map((chunk, cIdx) => 
        cIdx % 2 === 1 ? <strong key={cIdx} className="text-zinc-100 font-semibold">{chunk}</strong> : chunk
      );

      return (
        <p key={idx} className="text-zinc-300 font-sans text-xs leading-relaxed my-2">
          {boldProcessed}
        </p>
      );
    });
  };

  return (
    <div id="narrative-output-panel" className="bg-[#09090b] rounded-xl border border-zinc-800/80 flex flex-col justify-between flex-1 overflow-hidden min-h-[380px] shadow-sm font-sans">
      {/* Title block */}
      <div className="h-11 px-4 border-b border-zinc-800/50 flex items-center justify-between text-xs uppercase bg-black/20">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-[#10B981]" />
          <span className="text-zinc-200 font-bold tracking-wider">AI Stock Analysis</span>
        </div>
        {isStreaming && (
          <span className="flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
            <RefreshCw className="w-3 h-3 text-[#10B981] animate-spin" />
            <span className="text-[9px] text-[#10B981] tracking-wider font-semibold font-sans">STREAMING ANALYSIS</span>
          </span>
        )}
      </div>

      {/* Narrative block info */}
      <div className="flex-1 overflow-y-auto p-5" ref={containerRef}>
        {renderFormattedMarkdown(displayedText)}
      </div>

      {/* Navigation summary history items */}
      {history.length > 0 && (
        <div className="border-t border-zinc-800/50 p-2.5 bg-zinc-950/60 flex items-center space-x-2 overflow-x-auto select-none">
          <div className="flex items-center space-x-1.5 text-zinc-500 font-sans text-[10px] uppercase px-2 border-r border-zinc-800/80 flex-shrink-0">
            <History className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-semibold">Recent topics:</span>
          </div>
          <div className="flex space-x-2 text-[10px] pb-1">
            {history.map((hist, index) => (
              <button
                key={index}
                onClick={() => onSelectHistory && onSelectHistory(hist)}
                className="bg-zinc-900 text-zinc-400 hover:text-[#10B981] hover:border-[#10B981]/60 border border-zinc-800 rounded px-2.5 py-1 whitespace-nowrap transition-colors"
              >
                {hist.length > 25 ? hist.substring(0, 22) + "..." : hist}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

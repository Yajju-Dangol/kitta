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
        <div className="space-y-4 py-2 font-sans">
          <div className="flex flex-col space-y-1">
            <span className="text-[11px] text-zinc-500 font-medium">Market Overview</span>
            <h3 className="text-sm font-bold text-zinc-100">Latest Insights</h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {trendingInsights.map((insight, idx) => (
              <div
                key={idx}
                onClick={() => onSelectHistory && onSelectHistory(insight.prompt)}
                className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl hover:bg-zinc-800/50 transition-all cursor-pointer group shadow-sm flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold bg-gray text-zinc-400">
                    {insight.icon}
                    <span>{insight.tag}</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
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
      const processInlineStyles = (text: string) => {
        return text.split("**").map((boldChunk, bIdx) => {
          if (bIdx % 2 === 1) {
            return <strong key={`b-${bIdx}`} className="text-[#10B981] font-semibold">{boldChunk}</strong>;
          }
          return boldChunk.split("`").map((codeChunk, cIdx) => {
            if (cIdx % 2 === 1) {
              return <code key={`c-${bIdx}-${cIdx}`} className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-md font-mono text-[10px] mx-0.5">{codeChunk}</code>;
            }
            return codeChunk;
          });
        });
      };

      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const textContent = line.replace(/^\s*[\*\-]\s+/, "");
        return (
          <div key={idx} className="flex items-start space-x-2 my-1.5 text-zinc-300 font-sans text-xs leading-normal pl-2">
            <span className="text-[#10B981] mt-1 text-[10px]">•</span>
            <span>{processInlineStyles(textContent)}</span>
          </div>
        );
      }

      if (line.trim() === "") return <div key={idx} className="h-2" />;

      const processParaStyles = (text: string) => {
        return text.split("**").map((boldChunk, bIdx) => {
          if (bIdx % 2 === 1) {
            return <strong key={`b-${bIdx}`} className="text-zinc-100 font-semibold">{boldChunk}</strong>;
          }
          return boldChunk.split("`").map((codeChunk, cIdx) => {
            if (cIdx % 2 === 1) {
              return <code key={`c-${bIdx}-${cIdx}`} className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-md font-mono text-[10px] mx-0.5">{codeChunk}</code>;
            }
            return codeChunk;
          });
        });
      };

      return (
        <p key={idx} className="text-zinc-300 font-sans text-xs leading-relaxed my-2">
          {processParaStyles(line)}
        </p>
      );
    });
  };

  return (
    <div id="narrative-output-panel" className="bg-[#09090b] rounded-xl border border-zinc-800/80 flex flex-col justify-between flex-1 overflow-hidden min-h-[380px] shadow-sm font-sans">
      {/* Title block */}
      <div className="h-12 px-4 border-b border-zinc-800/50 flex items-center justify-between text-xs bg-zinc-900/30">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-300 font-semibold">Analysis Output</span>
        </div>
        {isStreaming && (
          <span className="flex items-center space-x-1.5 bg-zinc-800/50 border border-zinc-700 px-2.5 py-1 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
            <span className="text-[10px] text-zinc-300 font-medium">Generating...</span>
          </span>
        )}
      </div>

      {/* Narrative block info */}
      <div className="flex-1 overflow-y-auto p-5" ref={containerRef}>
        {renderFormattedMarkdown(displayedText)}
      </div>

      {/* Navigation summary history items */}
      {history.length > 0 && (
        <div className="border-t border-zinc-800/50 p-3 bg-zinc-900/30 flex items-center space-x-3 overflow-x-auto select-none">
          <div className="flex items-center space-x-1.5 text-zinc-500 text-xs px-2 border-r border-zinc-800/80 flex-shrink-0">
            <History className="w-3.5 h-3.5" />
            <span className="font-medium">Recent:</span>
          </div>
          <div className="flex space-x-2 text-xs">
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

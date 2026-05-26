import { useState, useEffect } from "react";
import { NewsItem } from "../types";
import { ChevronDown, ChevronUp, Link2, Newspaper, Sparkles } from "lucide-react";

interface NewsTimelineProps {
  news: NewsItem[];
  selectedNewsId?: string | null;
  onSelectNewsId?: (id: string | null) => void;
}

export default function NewsTimeline({ news, selectedNewsId, onSelectNewsId }: NewsTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto expand and highlight when selectedNewsId changes (e.g. clicked on chart)
  useEffect(() => {
    if (selectedNewsId) {
      setExpandedId(selectedNewsId);
      const el = document.getElementById(`news-card-${selectedNewsId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedNewsId]);

  const toggleExpand = (id: string) => {
    const nextId = expandedId === id ? null : id;
    setExpandedId(nextId);
    if (onSelectNewsId) {
      onSelectNewsId(nextId);
    }
  };

  return (
    <div id="news-timeline-panel" className="bg-[#09090B] border border-zinc-800/80 p-4 rounded-xl flex flex-col space-y-3 shadow-sm font-sans">
      
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-4 h-4 text-[#10B981]" />
          <span className="text-[10px] text-zinc-400 font-bold uppercase">Latest News</span>
        </div>
        <span className="text-[8px] font-mono text-zinc-500 uppercase">Live Updates</span>
      </div>

      {/* Accordion List */}
      <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
        {news.length === 0 ? (
          <div className="text-zinc-500 text-xs italic py-4">No recent signals logged for this asset model.</div>
        ) : (
          news.map((item) => {
            const isExpanded = expandedId === item.id;
            const isHighlighted = selectedNewsId === item.id;
            
            return (
              <div 
                key={item.id} 
                id={`news-card-${item.id}`}
                className={`border rounded-lg transition-all ${
                  isHighlighted 
                    ? 'border-[#10B981] bg-[#10B981]/5 shadow-[0_0_8px_rgba(16,185,129,0.05)]' 
                    : isExpanded 
                      ? 'border-zinc-700 bg-zinc-900/40' 
                      : 'border-zinc-800/80 bg-zinc-950/20 hover:border-zinc-700/80 hover:bg-zinc-950/60'
                }`}
              >
                {/* Trigger row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full text-left p-3.5 flex items-center justify-between transition-colors cursor-pointer select-none focus:outline-none"
                >
                  <div className="space-y-1.5 pr-4">
                    <div className="flex items-center space-x-3 text-[9px] font-mono text-[#10B981] uppercase tracking-wider">
                      <span className={`px-1.5 py-0.5 rounded border ${
                        isHighlighted ? 'bg-[#10B981] text-black border-[#10B981] font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}>
                        {item.date}
                      </span>
                      <span className="text-zinc-600">//</span>
                      <span className="font-bold">{item.symbol} FILING</span>
                    </div>
                    <span className={`text-xs font-semibold tracking-tight block transition-colors font-sans ${
                      isExpanded ? 'text-white' : 'text-zinc-300 hover:text-white'
                    }`}>
                      {item.title}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-zinc-500">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#10B981]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="px-4.5 pb-4 pt-2 border-t border-zinc-800/50 font-sans text-xs space-y-3.5 bg-black/25 rounded-b-lg">
                    {/* Diagnostic Bullets replaces raw news summary */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] text-[#10B981] tracking-wider font-bold uppercase flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI TL&DR & Impact on Share Value:</span>
                      </span>
                      
                      <ul className="space-y-2 pl-1">
                        {item.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start space-x-2 text-zinc-300">
                            <span className="text-[#10B981] font-mono text-[9px] mt-0.5">▸</span>
                            <span className="text-[11px] leading-relaxed font-sans">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Meta actions */}
                    <div className="flex items-center justify-between text-[8.5px] font-mono text-zinc-500 uppercase pt-2 border-t border-zinc-800/30">
                      <span>SECURE RECORD: {item.id}</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-[#10B981] inline-flex items-center space-x-1 transition-colors">
                        <Link2 className="w-3 h-3" />
                        <span>Source Verification Feed</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

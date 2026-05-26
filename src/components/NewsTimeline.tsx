import { useState } from "react";
import { NewsItem } from "../types";
import { ChevronDown, ChevronUp, Link2, Newspaper, HelpCircle } from "lucide-react";

interface NewsTimelineProps {
  news: NewsItem[];
}

export default function NewsTimeline({ news }: NewsTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div id="news-timeline-panel" className="bg-[#09090B] border border-[#202024] p-4 flex flex-col space-y-3">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-[#202024] pb-2">
        <div className="flex items-center space-x-2 font-mono">
          <Newspaper className="w-4 h-4 text-[#10B981]" />
          <span className="text-[10px] text-zinc-400 font-bold uppercase">AGGREGATED ANNOUNCEMENTS & LOGS</span>
        </div>
        <span className="text-[8px] font-mono text-zinc-500 uppercase">[ FEEDS: SHARESANSAR & MERO LAGANI ]</span>
      </div>

      {/* Accordion List */}
      <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-1">
        {news.length === 0 ? (
          <div className="text-zinc-600 font-mono text-xs italic py-4">No recent signals logged for this asset model.</div>
        ) : (
          news.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div 
                key={item.id} 
                className={`border border-[#202024] bg-black/30 hover:bg-black/50 transition-colors ${
                  isExpanded ? 'border-zinc-500 bg-[#141417]/10' : ''
                }`}
              >
                {/* Accordion Trigger row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full text-left p-3.5 flex items-center justify-between transition-colors cursor-pointer select-none focus:outline-none"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-3 text-[10px] font-mono text-[#10B981] uppercase tracking-wider">
                      <span className="bg-[#141417] px-1.5 py-0.5 border border-[#202024] text-zinc-400 font-bold">{item.date}</span>
                      <span className="text-zinc-500 font-semibold">//</span>
                      <span>{item.symbol} FEED</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-200 tracking-tight block mt-1 hover:text-[#10B981] transition-colors font-sans">
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
                  <div className="px-4.5 pb-4 pt-1 border-t border-[#141417]/80 font-sans text-xs space-y-3.5 bg-black/40 animate-fadeIn duration-200">
                    <p className="text-zinc-400 text-[11.5px] leading-relaxed italic border-l-2 border-[#10B981] pl-3.5 uppercase font-mono">
                      {item.summary}
                    </p>
                    
                    {/* Diagnostic Bullets */}
                    <div className="space-y-2 mt-2">
                      <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase block">
                        ANALYST APPRAISAL INSIGHT MATRIX:
                      </span>
                      <ul className="space-y-1.5 pl-1">
                        {item.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start space-x-2 text-zinc-300">
                            <span className="text-[#10B981] font-mono text-[9px] mt-0.5">▸</span>
                            <span className="text-[11px] leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Meta actions */}
                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-600 uppercase pt-2 border-t border-[#141417]">
                      <span>SECURE LOG: {item.id}</span>
                      <a href="#" className="hover:text-[#10B981] inline-flex items-center space-x-1">
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

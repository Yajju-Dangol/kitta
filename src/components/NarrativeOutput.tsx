import { useEffect, useState, useRef } from "react";
import { BookOpen, FileText, History, RefreshCw, Layers } from "lucide-react";
import { motion } from "motion/react";

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
    
    // Split into smaller chunks (words or groups of letters) to flow nicely
    const words = text.split(" ");
    let wordIdx = 0;
    
    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        setDisplayedText((prev) => (prev ? prev + " " + words[wordIdx] : words[wordIdx]));
        wordIdx++;
        
        // Auto scroll
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 25); // snappier typing

    return () => clearInterval(interval);
  }, [text, isStreaming]);

  // Clean formatting helper which renders paragraphs and standard markdown blocks correctly
  const renderFormattedMarkdown = (raw: string) => {
    if (!raw) {
      return (
        <div className="text-zinc-500 italic flex flex-col items-center justify-center h-48 space-y-3 font-sans">
          <BookOpen className="w-8 h-8 text-zinc-700 animate-pulse" />
          <span className="text-center max-w-[280px] text-xs leading-normal">
            Awaiting analysis instructions... Enter a company ticker or ask:
            <br />
            <span className="text-[#10B981] font-semibold cursor-pointer hover:underline block mt-1.5">
              "Is NABIL Bank a good buy?"
            </span>
          </span>
        </div>
      );
    }

    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      // Check for headings
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
      // Check for bullet items
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        const textContent = line.replace(/^\s*[\*\-]\s+/, "");
        // Highlight bold sections within the line
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

      // Default line processing (paragraphs)
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
          <span className="text-zinc-200 font-bold tracking-wider">Investment Thesis & AI Appraisal</span>
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

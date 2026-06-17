import { AnimatePresence, motion } from "motion/react";
import { TraceLine } from "../types";
import { Activity } from "lucide-react";

interface TraceConsoleProps {
  traces: TraceLine[];
}

export default function TraceConsole({ traces }: TraceConsoleProps) {
  return (
    <div id="trace-console" className="bg-[#09090b] rounded-xl border border-zinc-800/80 p-4 font-sans text-xs flex flex-col space-y-2 max-h-[140px] overflow-y-auto w-full shadow-sm">
      <div className="flex items-center space-x-2 border-b border-zinc-800/50 pb-2 mb-1 text-zinc-400">
        <Activity className="w-4 h-4 text-zinc-400" />
        <span className="font-semibold text-xs font-sans">System Logs</span>
      </div>
      
      {traces.length === 0 ? (
        <div className="text-zinc-500 italic font-sans text-[11px] py-1">Ready. Enter a custom appraisal prompt or select a suggested topic above.</div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {traces.map((trace) => {
              let icon = <span className="text-zinc-500">▸</span>;
              let textColor = "text-zinc-400";
              
              if (trace.status === "success") {
                icon = <span className="text-[#10B981] font-bold">✓</span>;
                textColor = "text-zinc-300 font-medium";
              } else if (trace.status === "warning") {
                icon = <span className="text-amber-500 font-bold">•</span>;
                textColor = "text-zinc-400";
              } else if (trace.status === "error") {
                icon = <span className="text-red-500 font-bold">✕</span>;
                textColor = "text-red-400";
              }

              // Strip terminal bracket labels like "▸ [Inbound]" or "▸ [Cache Hit]" to make them look elegant
              const printableText = trace.text
                .replace(/^▸\s*/, "")
                .replace(/^\[Cache Hit:\s*/, "Cached Feed - ")
                .replace(/^\[Cache Miss:\s*/, "Updating Feed - ")
                .replace(/^\[Ingestion\]\s*/, "Processing Data - ")
                .replace(/^\[Success\]\s*/, "Complete - ")
                .replace(/^\[Failure\]\s*/, "Failed - ");

              return (
                <motion.div
                  key={trace.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex items-start space-x-2 tab-nums ${textColor}`}
                >
                  <span className="flex-shrink-0 mt-0.5">{icon}</span>
                  <span className="font-sans text-[11.5px] tracking-tight">{printableText}</span>
                  <span className="text-[10px] text-zinc-500 font-mono ml-auto flex-shrink-0">
                    {new Date(trace.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

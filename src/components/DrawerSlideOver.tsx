import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, ShieldAlert, CheckCircle, Database } from "lucide-react";

interface DrawerSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  onCommitParameters: (symbol: string, rule: { metric: 'PE' | 'Price' | 'DivYield'; operator: '<' | '>'; value: number }) => void;
}

export default function DrawerSlideOver({ isOpen, onClose, symbol, onCommitParameters }: DrawerSlideOverProps) {
  const [metric, setMetric] = useState<'PE' | 'Price' | 'DivYield'>('PE');
  const [operator, setOperator] = useState<'<' | '>'>('<');
  const [value, setValue] = useState<number>(18.5);

  // Auto set reasonable defaults when asset symbol updates
  useEffect(() => {
    if (metric === 'PE') {
      setValue(18.5);
    } else if (metric === 'Price') {
      setValue(1000);
    } else {
      setValue(3.0);
    }
  }, [metric, symbol]);

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    onCommitParameters(symbol, {
      metric,
      operator,
      value: parseFloat(value as any) || 0
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Static backdrop with zero blur to align with raw black wireframe aesthetic */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#000000] z-40 cursor-pointer pointer-events-auto"
          />

          {/* Drawer content chassis */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} // Snappy exponential easeOut
            className="fixed right-0 top-0 bottom-0 w-[380px] bg-[#09090B] border-l border-[#202024] p-5 shadow-2xl z-50 flex flex-col justify-between"
          >
            {/* Header section */}
            <div>
              <div className="flex items-center justify-between border-b border-[#202024] pb-3 mb-5">
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">TELEMETRY MODULE 08</span>
                  <span className="font-sans text-sm font-bold text-zinc-100 flex items-center space-x-1.5 uppercase mt-0.5">
                    <ShieldAlert className="w-4 h-4 text-[#10B981]" />
                    <span>Config: {symbol} Signals</span>
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="text-zinc-500 hover:text-zinc-100 p-1 border border-[#202024] bg-[#141417] hover:border-[#EF4444] hover:text-[#EF4444] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Parameter Selection matrix parameters form */}
              <form onSubmit={handleCommit} className="space-y-5">
                {/* Metric choice */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] text-zinc-400 uppercase tracking-wide block">Select Monitoring Metric</label>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                    {(['PE', 'Price', 'DivYield'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetric(m)}
                        className={`py-2 px-2.5 border text-center transition-all cursor-pointer font-bold ${
                          metric === m 
                            ? 'bg-[#141417] border-[#10B981] text-[#10B981]' 
                            : 'bg-black border-[#202024] text-zinc-400 hover:text-zinc-100'
                        }`}
                      >
                        {m === 'PE' ? 'P/E Ratio' : m === 'Price' ? 'Value (NPR)' : 'Yield %'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operator selector logic */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] text-zinc-400 uppercase tracking-wide block">Trigger Operator Condition</label>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setOperator('<')}
                      className={`py-2 border text-center transition-all cursor-pointer ${
                        operator === '<' 
                          ? 'bg-[#141417] border-[#10B981] text-[#10B981] font-bold' 
                          : 'bg-black border-[#202024] text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      LESS THAN (&lt;)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperator('>')}
                      className={`py-2 border text-center transition-all cursor-pointer ${
                        operator === '>' 
                          ? 'bg-[#141417] border-[#10B981] text-[#10B981] font-bold' 
                          : 'bg-black border-[#202024] text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      GREATER THAN (&gt;)
                    </button>
                  </div>
                </div>

                {/* Numerical bounds input slider and field */}
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] text-zinc-400 uppercase tracking-wide block">Threshold Value Limit</label>
                  <div className="bg-[#141417] border border-[#202024] p-1.5 flex items-center">
                    <input
                      type="number"
                      step={metric === 'DivYield' ? 0.1 : metric === 'PE' ? 0.5 : 5}
                      value={value}
                      onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent border-none text-zinc-100 font-mono text-sm tracking-tight focus:outline-none focus:ring-0"
                    />
                    <span className="font-mono text-[10px] text-zinc-500 uppercase px-2 py-0.5 bg-black/40 border border-[#202024]">
                      {metric === 'PE' ? 'MULT' : metric === 'Price' ? 'NPR' : 'YLD%'}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-zinc-500 leading-normal block uppercase">
                    Recommended sector default averages are flagged at {metric === 'PE' ? '18.5' : metric === 'Price' ? '500 NPR' : '3.0%'}.
                  </span>
                </div>

                {/* System integrity guidelines note */}
                <div className="bg-black/40 border border-[#202024]/60 p-3 flex space-x-2.5">
                  <Database className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div className="font-mono text-[10px] text-zinc-500 space-y-1">
                    <span className="font-bold text-zinc-400 uppercase block">AUTOMATED INTEGRITY CHECK:</span>
                    <p className="leading-snug text-left uppercase">
                      Telemetry registers with local memory streams. Real-time Pub/Sub channels push alerts automatically when constraints evaluate.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Slide action commits */}
            <div className="space-y-2 pt-4 border-t border-[#202024]">
              <button
                onClick={handleCommit}
                className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/95 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-[#10B981]/15"
              >
                <CheckCircle className="w-4 h-4 text-black" strokeWidth={2.5} />
                <span>CONFIRM TELEMETRY (COMMIT SEED)</span>
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 bg-transparent text-zinc-400 hover:text-white font-mono text-[10px] uppercase tracking-wider flex items-center justify-center transition-all cursor-pointer"
              >
                Discard Parameters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

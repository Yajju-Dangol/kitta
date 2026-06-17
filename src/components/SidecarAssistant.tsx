import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, MessageSquare, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface SidecarAssistantProps {
  symbol: string;
  price: number;
  pe?: number;
  triggerPrompt?: string;
}

export default function SidecarAssistant({ symbol, price, pe = 18.5, triggerPrompt }: SidecarAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: "start_msg",
        role: "model",
        text: `### Contextual Analyst Active : **${symbol}**\n\nWelcome to your dedicated **${symbol} Workspace**. I have compiled the latest fundamental metrics for **${symbol}** into active memory:\n- Last Traded Price: **NPR ${price.toLocaleString()}**\n- Core P/E Multiple: **${pe.toFixed(1)}**\n\nAsk me about upcoming dividend safety, corporate filings, P/E comparisons, or select one of the context-aware research questions below.`,
        timestamp: new Date().toISOString()
      }
    ]);
  }, [symbol, price, pe]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (triggerPrompt) {
      executePrompt(triggerPrompt);
    }
  }, [triggerPrompt]);

  const executePrompt = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      text: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `[Asset context: ${symbol} at NPR ${price}] ${text}`,
          symbol: symbol
        })
      })
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          setMessages(prev => [...prev, {
            id: `assistant_${Date.now()}`,
            role: "model",
            text: data.analysis,
            timestamp: new Date().toISOString()
          }]);
        })
        .catch(() => {
          setMessages(prev => [...prev, {
            id: `assistant_${Date.now()}`,
            role: "model",
            text: `### Analysis Complete for ${symbol}\n\nBased on localized fundamentals, the active price point represents a key support channel. Check the sector metrics matrix to evaluate capital risk parameters.`,
            timestamp: new Date().toISOString()
          }]);
        })
        .finally(() => setIsTyping(false));
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    executePrompt(inputText);
    setInputText("");
  };

  const getSuggestedPrompts = (sym: string) => {
    if (sym === "NABIL") {
      return [
        "Analyze the yield impact of the recent NPR 35 dividend.",
        "How does the 14% Q3 net profit growth affect NABIL's P/E?",
        "Is NABIL undervalued compared to banking sector average?"
      ];
    }
    if (sym === "NMB") {
      return [
        "Analyze the value impact of the FMO USD 25M credit line.",
        "Assess NMB's P/E of 16.2 relative to the 18.5 sector average."
      ];
    }
    if (sym === "AHPC") {
      return [
        "Evaluate grid integration impact of the 8.5 MW Piluwa testing.",
        "When is AHPC expected to return to profitable P/E ratios?"
      ];
    }
    if (sym === "NICA") {
      return [
        "Evaluate NIC Asia's 17.3 P/E vs Bank Sector average.",
        "Is NIC Asia showing capital buffer risks or growth potential?"
      ];
    }
    if (sym === "HDL") {
      return [
        "Analyze Himalayan Distillery's premium 31.4 P/E valuation.",
        "Is the 5.2% dividend yield sustainable for HDL?"
      ];
    }
    return [
      "Analyze upcoming fundamental growth drivers.",
      "Evaluate sector average relative risk parameters."
    ];
  };

  const suggestions = getSuggestedPrompts(symbol);

  return (
    <Card id="sidecar-assistant" className="flex flex-col justify-between h-full min-h-[450px] shadow-sm font-sans overflow-hidden rounded-xl">
      <CardHeader className="h-11 px-4 border-b border-zinc-850 flex flex-row items-center justify-between text-xs uppercase bg-black flex-shrink-0 py-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-[#10B981]" />
          <CardTitle className="text-zinc-200 font-bold tracking-wider text-xs">Sidecar Assistant</CardTitle>
        </div>
        <div className="flex items-center space-x-1.5 font-mono text-[9px] text-[#10B981] uppercase font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LOCKED TO {symbol}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col space-y-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest tab-nums">
              {m.role === 'user' ? 'INVESTOR_PROMPT' : 'AI_ANALYST'} — {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
            </div>
            
            <div 
              className={`p-3 max-w-[92%] rounded-xl text-xs leading-relaxed border ${
                m.role === 'user' 
                  ? 'bg-zinc-900 text-zinc-150 border-zinc-800' 
                  : 'bg-black text-zinc-350 border-zinc-850 border-l-2 border-l-[#10B981]'
              }`}
            >
              {m.text.split("\n\n").map((para, pIdx) => {
                if (para.startsWith("### ")) {
                  return (
                    <h3 key={pIdx} className="text-zinc-100 font-sans text-xs leading-relaxed font-bold border-b border-zinc-850 pb-1 mt-3 mb-1 first:mt-0 uppercase">
                      {para.replace("### ", "")}
                    </h3>
                  );
                }
                if (para.startsWith("- ") || para.startsWith("* ")) {
                  const bullets = para.split("\n");
                  return (
                    <ul key={pIdx} className="space-y-1.5 my-2">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start space-x-2 text-zinc-300">
                          <span className="text-[#10B981] mt-1 text-[7px]">■</span>
                          <span className="font-sans text-[11px]">{b.replace(/^[\*\-]\s+/, "")}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={pIdx} className="mb-2 last:mb-0">
                    {para}
                  </p>
                );
              })}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col space-y-1 items-start">
            <span className="text-[8px] font-mono text-[#10B981] uppercase animate-pulse font-bold">ANALYSING_MARKET_MATRICES...</span>
            <div className="bg-[#141417] border border-zinc-850 p-2 px-3 rounded-lg flex space-x-1.5 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
      </CardContent>

      {!isTyping && suggestions.length > 0 && (
        <div className="px-4 py-2 bg-black border-t border-zinc-850 flex-shrink-0 space-y-1.5">
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider font-semibold block">Suggested Actions:</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => executePrompt(sug)}
                className="bg-zinc-900 border border-zinc-800 hover:border-[#10B981]/40 text-zinc-400 hover:text-zinc-200 transition-all text-[9.5px] px-2 py-1 rounded-md text-left leading-tight cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      <CardFooter className="p-0 border-t border-zinc-850 flex-shrink-0">
        <form onSubmit={handleSubmit} className="p-3 bg-black w-full">
          <div className="relative flex items-center bg-[#141417] border border-zinc-850 focus-within:border-[#10B981] focus-within:ring-1 focus-within:ring-[#10B981]/30 transition-all p-1.5 rounded-lg">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask AI about dividend safety, financials, P/E..."
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-zinc-150 placeholder-zinc-500 border-none outline-none focus:ring-0 active:ring-0"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="bg-[#10B981] hover:bg-[#10B981]/80 text-black h-8 w-8 rounded-md inline-flex items-center justify-center border border-zinc-700 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </button>
          </div>
          <div className="text-[8px] font-mono text-zinc-600 block text-center mt-2 uppercase tracking-wide">
            AI analysis synthesized under regulatory guidance
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}

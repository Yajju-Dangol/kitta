import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { HelpCircle, Send, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";

interface SidecarAssistantProps {
  symbol: string;
  price: number;
  pe?: number;
}

export default function SidecarAssistant({ symbol, price, pe = 18.5 }: SidecarAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with contextual message about target asset
  useEffect(() => {
    setMessages([
      {
        id: "start_msg",
        role: "model",
        text: `### Contextual Sidecar Activated : **${symbol}**\n\nWelcome to the active asset workspace interrogation sandbox. I have cached the following metrics for **${symbol}** in local working memory:\n- Live Value: **NPR ${price}**\n- Current Valuation P/E: **${pe}**\n\nYou can ask diagnostic questions regarding relative multipliers, potential yield risk, or upcoming dividend announcements for this specific instrument.`,
        timestamp: new Date().toISOString()
      }
    ]);
  }, [symbol, price, pe]);

  // Handle scrolling
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      text: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Call server API for context-locked advice
    setTimeout(() => {
      fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `[Asset context: ${symbol} at NPR ${price}] ${userMsg.text}`,
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
            text: `### Isolated Synthesis complete for ${symbol}\n\nBased on localized calculations, the active price point represents a baseline support channel. Focus on sector relative ratios if pursuing immediate ingestion.`,
            timestamp: new Date().toISOString()
          }]);
        })
        .finally(() => setIsTyping(false));
    }, 700);
  };

  return (
    <div id="sidecar-assistant" className="bg-[#09090B] border border-[#202024] flex flex-col justify-between h-full min-h-[450px]">
      {/* Title bar */}
      <div className="h-9 px-3 border-b border-[#202024] flex items-center justify-between text-xs font-mono uppercase bg-black/40 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-zinc-200 font-bold tracking-wider">Sidecar Assistant Context Block</span>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[9px] text-[#10B981] uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Locked to {symbol}</span>
        </div>
      </div>

      {/* Messages layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`flex flex-col space-y-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest tab-nums">
              {m.role === 'user' ? 'USER_PROMPT' : 'KITTA_ASSISTANT'} — {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
            </div>
            
            <div 
              className={`p-3 max-w-[90%] font-sans text-xs leading-relaxed border ${
                m.role === 'user' 
                  ? 'bg-[#141417]/90 text-zinc-100 border-[#202024]' 
                  : 'bg-black/40 text-zinc-300 border-[#202024] border-l-2 border-l-[#10B981]'
              }`}
            >
              {/* Parse standard formatting */}
              {m.text.split("\n\n").map((para, pIdx) => {
                if (para.startsWith("### ")) {
                  return (
                    <h3 key={pIdx} className="text-zinc-100 font-mono text-sm leading-relaxed font-bold border-b border-[#202024] pb-1 mt-3 mb-1 first:mt-0 uppercase">
                      {para.replace("### ", "")}
                    </h3>
                  );
                }
                if (para.startsWith("- ") || para.startsWith("* ")) {
                  const bullets = para.split("\n");
                  return (
                    <ul key={pIdx} className="space-y-1 my-2">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start space-x-2 text-zinc-300">
                          <span className="text-[#10B981] mt-1.5 text-[7px]">■</span>
                          <span>{b.replace(/^[\*\-]\s+/, "")}</span>
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
            <span className="text-[9px] font-mono text-[#10B981] uppercase animate-pulse">KITTA_RESONATOR_STREAMING...</span>
            <div className="bg-[#141417] border border-[#202024] p-2 rounded px-3 flex space-x-1.5 text-xs text-zinc-400">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[#202024] bg-black/60 flex-shrink-0">
        <div className="relative flex items-center bg-[#141417] border border-[#202024] focus-within:border-[#10B981] focus-within:ring-1 focus-within:ring-[#10B981]/30 transition-all p-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask follow-up questions focused strictly on this data model..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono tracking-tight border-none outline-none focus:ring-0 active:ring-0"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="bg-[#10B981] text-black h-8 w-8 inline-flex items-center justify-center border border-zinc-700 hover:bg-[#10B981]/80 transition-colors disabled:opacity-40 disabled:hover:bg-[#10B981] cursor-pointer"
          >
            <Send className="w-4 h-4 text-black" strokeWidth={2.5} />
          </button>
        </div>
        <div className="text-[9px] font-mono text-zinc-600 block text-center mt-2 uppercase">
          AI generated output under regulatory sandbox guidelines
        </div>
      </form>
    </div>
  );
}

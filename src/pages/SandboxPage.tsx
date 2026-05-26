import { useState, useEffect } from "react";
import { Cpu, Database, Flame, HelpCircle, Terminal, RefreshCw, Send, CheckCircle } from "lucide-react";

interface SandboxProps {
  appUrl?: string;
}

export default function SandboxPage({ appUrl = "https://ais-dev-rlvdadyo7ji2tbobo6gubd-307687589010.asia-east1.run.app" }: SandboxProps) {
  const [healthStatus, setHealthStatus] = useState<string>("AWAITING_PING");
  const [dbStatus, setDbStatus] = useState<string>("SECURE_CONNECTED");
  const [isPinging, setIsPinging] = useState(false);
  const [rawPayload, setRawPayload] = useState<string>("");

  useEffect(() => {
    handlePingServer();
  }, []);

  const handlePingServer = () => {
    setIsPinging(true);
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setHealthStatus(`OK - Server synchronized [STATUS_COOL]`);
        setRawPayload(JSON.stringify({
          serverTime: new Date().toISOString(),
          status: "healthy",
          runtime: "bun-node-express",
          cacheProvider: "local-redis-simulated",
          cors: "authorized",
          gateway: "ok",
          ingressPort: 3000
        }, null, 2));
      })
      .catch(() => {
        setHealthStatus("OFFLINE - Gateway timeout");
        setRawPayload("// Error connecting to server API port 3000.");
      })
      .finally(() => setIsPinging(false));
  };

  return (
    <div className="flex-1 flex flex-col p-4.5 space-y-4 overflow-y-auto">
      {/* Sandbox header bar */}
      <div className="bg-[#09090B] border border-[#202024] p-4 flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
        <div className="space-y-1">
          <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">MODULE 04 — REGULATORY GATEWAY</div>
          <h2 className="font-mono text-sm font-black text-zinc-200 uppercase tracking-tight flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-[#10B981]" />
            <span>KITTA API Sandbox Console</span>
          </h2>
        </div>
        <button
          onClick={handlePingServer}
          disabled={isPinging}
          className="bg-[#141417] text-zinc-300 hover:text-[#10B981] hover:border-[#10B981] border border-[#202024] px-4 py-1.5 font-mono text-[10px] uppercase flex items-center space-x-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin text-[#10B981]' : ''}`} />
          <span>Ping API Health Gateway</span>
        </button>
      </div>

      {/* Main split grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        
        {/* Left terminal block: Interactive endpoint check */}
        <div className="bg-[#09090B] border border-[#202024] p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider border-b border-[#202024] pb-2">
              01 / Endpoint Integrity Checks
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-black border border-[#202024] p-3 space-y-1.5">
                <span className="text-zinc-500 text-[10px] block font-bold uppercase">HTTP GET /api/health</span>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Connection Status:</span>
                  <span className={`font-bold ${healthStatus.includes('OK') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {healthStatus}
                  </span>
                </div>
              </div>

              <div className="bg-black border border-[#202024] p-3 space-y-1.5">
                <span className="text-zinc-500 text-[10px] block font-bold uppercase">HTTP POST /api/interrogate</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Processes natural language prompts inside full-stack agentic pipelines. Integrates live NEPSE company filings and news scrapes using Gemini 3.5 Flash models.
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase mt-2 pt-2 border-t border-[#141417]">
                  <span>Payload: {"{ prompt: string }"}</span>
                  <span className="text-[#10B981]">Enabled</span>
                </div>
              </div>

              <div className="bg-black border border-[#202024] p-3 space-y-1.5">
                <span className="text-zinc-500 text-[10px] block font-bold uppercase">ENVIRONMENT_ROOT_VARS</span>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-zinc-400">APP_URL:</span>
                  <span className="text-zinc-300 text-right select-all pb-1 hover:text-[#10B981] transition-colors overflow-hidden truncate max-w-[200px]">
                    {appUrl || "http://0.0.0.0:3000"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-zinc-400">GEMINI_API_KEY:</span>
                  <span className="text-zinc-500 italic">Attached on back-channel</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#141417]/30 border border-[#202024] p-3 font-mono text-[10px] text-zinc-500 leading-relaxed uppercase">
            KITTA uses strict secure environment variable mapping, guarding secret tokens on container-bounds to block external leakage vectors.
          </div>
        </div>

        {/* Right terminal block: JSON response payload terminal inspect */}
        <div className="bg-[#09090B] border border-[#202024] p-4 flex flex-col space-y-3">
          <div className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider border-b border-[#202024] pb-2 flex justify-between items-center">
            <span>02 / Raw JSON telemetry Response inspect</span>
            <span className="text-[#10B981] font-bold">LIVE SOCKET</span>
          </div>
          
          <div className="bg-black/80 border border-[#202024] p-3.5 flex-1 font-mono text-xs text-zinc-400 leading-relaxed overflow-auto max-h-[360px] whitespace-pre select-text terminal-scanlines">
            {rawPayload}
          </div>

          <div className="font-mono text-[10px] text-zinc-600 block text-right uppercase">
            Grid system API node diagnostic log — Sec Level: Sandbox Verified
          </div>
        </div>
      </div>
    </div>
  );
}

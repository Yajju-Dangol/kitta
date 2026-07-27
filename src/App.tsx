/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Stock, AlertRule } from "./types";
import NavigationSidebar from "./components/NavigationSidebar";
import TelemetryStrip from "./components/TelemetryStrip";
import MainTerminalPage from "./pages/MainTerminalPage";
import AssetDeepDivePage from "./pages/AssetDeepDivePage";
import WatchlistForgePage from "./pages/WatchlistForgePage";
import MacroInsightsHubPage from "./pages/MacroInsightsHubPage";
import LandingPage from "./pages/LandingPage";
import { AnimatedAIChat } from "./components/ui/animated-ai-chat";
import { supabase } from "./lib/supabase";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'drilldown' | 'watchlist' | 'sandbox'>('landing');
  const [selectedSymbol, setSelectedSymbol] = useState<string>("NABIL");
  const [prefilledPrompt, setPrefilledPrompt] = useState<string | undefined>(undefined);
  const [dbLatency, setDbLatency] = useState(12);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Core synchronized arrays
  const [stocks, setStocks] = useState<Stock[]>([
    {
      symbol: "NABIL",
      name: "Nabil Bank Limited",
      price: 1245,
      open: 1230,
      high52: 1520,
      low52: 1050,
      volume: "1,245K",
      sector: "Commercial Banks",
      eps: 58.2,
      pe: 21.4,
      nav: 212,
      divYield: 3.1,
      sentiment: 78,
      sparkline: [1200, 1210, 1195, 1220, 1225, 1215, 1230, 1235, 1240, 1245]
    },
    {
      symbol: "NMB",
      name: "NMB Bank Limited",
      price: 410,
      open: 415,
      high52: 580,
      low52: 350,
      volume: "845K",
      sector: "Commercial Banks",
      eps: 25.3,
      pe: 16.2,
      nav: 145,
      divYield: 4.2,
      sentiment: 42,
      sparkline: [430, 425, 420, 418, 412, 415, 410, 408, 412, 410]
    },
    {
      symbol: "AHPC",
      name: "Arun Valley Hydropower",
      price: 280,
      open: 275,
      high52: 420,
      low52: 210,
      volume: "1,850K",
      sector: "Hydropower",
      eps: 12.1,
      pe: 23.1,
      nav: 108,
      divYield: 0.0,
      sentiment: 35,
      sparkline: [290, 285, 280, 274, 277, 281, 280, 276, 278, 280]
    },
    {
      symbol: "NICA",
      name: "NIC Asia Bank Limited",
      price: 720,
      open: 715,
      high52: 980,
      low52: 650,
      volume: "960K",
      sector: "Commercial Banks",
      eps: 41.5,
      pe: 17.3,
      nav: 180,
      divYield: 2.8,
      sentiment: 65,
      sparkline: [700, 712, 705, 715, 722, 718, 720, 723, 719, 720]
    },
    {
      symbol: "HDL",
      name: "Himalayan Distillery",
      price: 2150,
      open: 2180,
      high52: 2900,
      low52: 1850,
      volume: "320K",
      sector: "Manufacturing",
      eps: 68.4,
      pe: 31.4,
      nav: 195,
      divYield: 5.2,
      sentiment: 82,
      sparkline: [2100, 2125, 2140, 2130, 2160, 2150, 2145, 2135, 2155, 2150]
    }
  ]);

  const [alerts, setAlerts] = useState<AlertRule[]>([
    { id: "alert_1", symbol: "NABIL", metric: "PE", operator: "<", value: 22.0, active: true, tag: "Monitoring Verified" },
    { id: "alert_2", symbol: "NMB", metric: "Price", operator: "<", value: 450, active: true, tag: "Monitoring Verified" },
    { id: "alert_3", symbol: "AHPC", metric: "DivYield", operator: ">", value: 1.0, active: false, tag: "Inactive" }
  ]);

  // Synchronise database details on mounting
  useEffect(() => {
    fetchStocks();
    fetchAlerts();

    // Minor database heartbeat simulation which updates database latency randomly
    const interval = setInterval(() => {
      setDbLatency(prev => Math.max(9, Math.min(16, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchStocks = () => {
    fetch("/api/stocks")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setStocks(data);
        } else if (data && Array.isArray(data.stocks)) {
          setStocks(data.stocks);
        }
      })
      .catch(() => {});
  };

  const fetchAlerts = () => {
    const headers: Record<string, string> = {};
    const token = session?.access_token;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch("/api/alerts", { headers })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => setAlerts(data))
      .catch(() => {});
  };

  // Hover quick link transition callback triggering User Flow 1
  const handleTriggerInterrogation = (symbol: string) => {
    setSelectedSymbol(symbol);
    setPrefilledPrompt(`Analyze ${symbol} financials, current valuation relative ratios and overall appraisal recommendations.`);
    setCurrentView('dashboard');
  };

  const handleNavigateToDrilldown = (symbol: string) => {
    setSelectedSymbol(symbol);
    setCurrentView('drilldown');
  };

  // Render relevant structural page inside primary workspace viewport
  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="flex w-full h-full overflow-hidden lab-bg">
            <AnimatedAIChat />
          </div>
        );
      case 'drilldown':
        return (
          <AssetDeepDivePage
            stocks={stocks}
            selectedSymbol={selectedSymbol}
            onNavigateToCoreDeck={() => setCurrentView('dashboard')}
            session={session}
          />
        );
      case 'watchlist':
        return (
          <WatchlistForgePage
            stocks={stocks}
            alerts={alerts}
            onTriggerInterrogation={handleTriggerInterrogation}
            onRefreshAlerts={fetchAlerts}
            onNavigateToDrilldown={handleNavigateToDrilldown}
            session={session}
          />
        );
      case 'sandbox':
        return (
          <MacroInsightsHubPage />
        );
      default:
        return (
          <div className="p-6 font-mono text-xs text-zinc-500">
            Error loading system deck layout.
          </div>
        );
    }
  };

  // Handle landing page bypass
  if (currentView === 'landing') {
    return <LandingPage onEnterApp={() => setCurrentView('dashboard')} session={session} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#000000] text-zinc-300 font-sans overflow-hidden antialiased">
      {/* Main split viewport navigation chassis */}
      <NavigationSidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        dbLatency={dbLatency}
        session={session}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top telemetry band */}
        <TelemetryStrip />

        {/* Primary variable content workspace canvas */}
        <div className="flex-1 min-h-0 relative bg-black flex flex-col overflow-hidden">
          {renderViewContent()}
        </div>
      </div>
    </div>
  );
}

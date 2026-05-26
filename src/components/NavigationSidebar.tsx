import { LayoutDashboard, BarChart3, ListFilter, Layers, ShieldCheck, User } from "lucide-react";

interface SidebarProps {
  currentView: 'dashboard' | 'drilldown' | 'watchlist' | 'sandbox';
  onViewChange: (view: 'dashboard' | 'drilldown' | 'watchlist' | 'sandbox') => void;
  dbLatency?: number;
}

export default function NavigationSidebar({ currentView, onViewChange, dbLatency = 12 }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'AI Appraisal', icon: LayoutDashboard },
    { id: 'drilldown', label: 'Stock Details', icon: BarChart3 },
    { id: 'watchlist', label: 'Watchlist', icon: ListFilter },
    { id: 'sandbox', label: 'Sector Trends', icon: Layers },
  ] as const;

  return (
    <div id="navigation-sidebar" className="w-[18%] min-w-[210px] bg-[#09090b] border-r border-[#202024] flex flex-col justify-between h-full select-none z-10 font-sans">
      {/* Top Header */}
      <div className="p-5 border-b border-[#202024]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-sans font-extrabold tracking-tight text-white">
              Kitta<span className="text-[#10B981]">.</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide mt-0.5">
              NEPSE Stock Valuation
            </span>
          </div>
          {/* Active status pill */}
          <div className="flex items-center space-x-1.5 bg-[#141417] border border-[#202024] px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
            <span className="text-[8px] font-semibold text-[#10B981] uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* Main vertical links */}
      <div className="flex-1 py-6 px-3">
        <div className="space-y-1 mt-2">
          <span className="text-[10px] font-semibold tracking-wider text-zinc-500 block px-3.5 uppercase mb-3 font-sans">
            Navigation
          </span>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`w-full group text-left px-3.5 py-2.5 rounded-lg text-sm flex items-center transition-all ${
                  isActive
                    ? 'bg-[#141417] text-[#10B981] font-medium border border-[#202024]'
                    : 'text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-[#141417]/40'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-[#10B981]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Component: Logged in User Profile Info */}
      <div className="p-4 border-t border-[#202024] bg-[#0c0c0e] space-y-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <User className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-300 truncate">yajjudangol1@gmail.com</span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono flex items-center space-x-1">
              <ShieldCheck className="w-3" />
              <span>Verified Account</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] text-zinc-600 font-sans border-t border-zinc-850 pt-2.5">
          <span>Active Feed Connection</span>
          <span>v1.2.0</span>
        </div>
      </div>
    </div>
  );
}

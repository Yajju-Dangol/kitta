import { BentoGrid, type BentoItem } from "../components/ui/bento-grid";
import { SectorDropdown } from "../components/ui/sector-dropdown";
import { Landmark, Zap, Factory, TrendingUp } from "lucide-react";

export default function MacroInsightsHubPage() {
  const items: BentoItem[] = [
    {
      title: "Commercial Banks",
      meta: "P/E: 18.3 | Yield: 3.3%",
      description: "Currently trading at historical valuation discounts relative to global markets. Clear signs of foreign and institutional buyers picking up blue-chip banking credits near key support zones.",
      icon: <Landmark className="w-4 h-4 text-[#10B981]" />,
      status: "ACCUMULATE",
      tags: ["Value Play", "Institutional Inflow"],
      colSpan: 2,
      hasPersistentHover: true,
      cta: "Analyze Sector →"
    },
    {
      title: "Hydropower",
      meta: "P/E: 23.1",
      description: "Experiencing localized margin compression from high leverage ratios and seasonal runoff drops. Recommended tactical allocation shifts to cash until secondary arrays come online.",
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      status: "REDUCE EXPOSURE",
      tags: ["Liquidity Stress", "Growth Risk"],
      colSpan: 1,
      cta: "Analyze Sector →"
    },
    {
      title: "Manufacturing & Distillery",
      meta: "P/E: 31.4 | Yield: 5.2%",
      description: "Strong consumer demand structures allow premium pricing leverage. Strong balance sheets with high asset yield parameters provide premium defenses against macro shifts.",
      icon: <Factory className="w-4 h-4 text-purple-400" />,
      status: "HOLD",
      tags: ["Defensive", "High Yield"],
      colSpan: 2,
      cta: "Analyze Sector →"
    },
    {
      title: "Market Rotation Snapshot",
      meta: "AI Scan",
      description: "Institutional money is actively rotating out of highly leveraged Hydropower into blue-chip Commercial Banks. Maintain defensive positioning in Manufacturing for high-yield baseline.",
      icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
      status: "LIVE ANALYSIS",
      tags: ["Rotation", "Macro"],
      colSpan: 1,
      cta: "View Full Deck →"
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-5 space-y-6 overflow-y-auto font-sans w-full max-w-full">
      <SectorDropdown />
      
      <BentoGrid items={items} />
    </div>
  );
}

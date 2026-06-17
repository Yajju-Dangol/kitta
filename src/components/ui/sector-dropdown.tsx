"use client"

import type React from "react"
import { useState } from "react"
import { Landmark, Zap, Factory, ShieldCheck, Coins, Briefcase, Building, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Sector {
  id: string
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  status: string
}

const sectors: Sector[] = [
  {
    id: "commercial-banks",
    icon: <Landmark className="h-4 w-4" />,
    iconBg: "bg-emerald-500/10 text-emerald-500",
    title: "Commercial Banks",
    description: "Primary financial institutions and large-cap banks",
    status: "ACCUMULATE",
  },
  {
    id: "hydropower",
    icon: <Zap className="h-4 w-4" />,
    iconBg: "bg-amber-500/10 text-amber-500",
    title: "Hydropower",
    description: "Energy generation and distribution companies",
    status: "REDUCE EXPOSURE",
  },
  {
    id: "manufacturing",
    icon: <Factory className="h-4 w-4" />,
    iconBg: "bg-purple-500/10 text-purple-500",
    title: "Manufacturing & Distillery",
    description: "Industrial production and consumer goods",
    status: "HOLD",
  },
  {
    id: "insurance",
    icon: <ShieldCheck className="h-4 w-4" />,
    iconBg: "bg-blue-500/10 text-blue-500",
    title: "Life & Non-Life Insurance",
    description: "Risk management and policy providers",
    status: "HOLD",
  },
  {
    id: "microfinance",
    icon: <Coins className="h-4 w-4" />,
    iconBg: "bg-rose-500/10 text-rose-500",
    title: "Microfinance",
    description: "Rural and small-scale credit institutions",
    status: "ACCUMULATE",
  },
]

export function SectorDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSector, setSelectedSector] = useState<Sector>(sectors[0])

  const handleSelect = (sector: Sector, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSector(sector)
    setIsOpen(false)
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto z-50">
      {/* Header Container */}
      <div
        className={cn(
          "w-full rounded-xl cursor-pointer select-none bg-[#09090B] border border-zinc-800/80 shadow-sm transition-all duration-300",
          isOpen ? "ring-1 ring-[#10B981]/50" : "hover:border-zinc-700"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4 p-4.5">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300", selectedSector.iconBg)}>
            {selectedSector.icon}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-sans text-[9px] text-[#10B981] uppercase tracking-widest font-semibold flex items-center space-x-1.5 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>Market Sectors • Active Scope</span>
            </div>
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-tight">
              {selectedSector.title}
            </h2>
          </div>
          <div className="flex h-8 w-8 items-center justify-center">
            <ChevronDown
              className={cn(
                "h-5 w-5 text-zinc-500 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </div>
        </div>
      </div>

      {/* Sector List Overlay */}
      <div
        className={cn(
          "absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-[#09090B] border border-zinc-800/80 shadow-2xl overflow-hidden",
          "transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top",
          isOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"
        )}
      >
        <div className="p-2">
          <div className="space-y-1">
            {sectors.map((sector, index) => (
              <div
                key={sector.id}
                onClick={(e) => handleSelect(sector, e)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 cursor-pointer",
                  "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  "hover:bg-zinc-800/40",
                  selectedSector.id === sector.id ? "bg-zinc-800/40" : "",
                  isOpen ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                )}
                style={{
                  transitionDelay: isOpen ? `${index * 40}ms` : "0ms",
                }}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300", sector.iconBg)}>
                  {sector.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-200">{sector.title}</h4>
                  <p className="text-xs text-zinc-500 truncate">{sector.description}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest bg-white/5 border border-white/10",
                  sector.status === "ACCUMULATE" ? "text-emerald-500" : 
                  sector.status === "REDUCE EXPOSURE" ? "text-amber-500" : "text-zinc-400"
                )}>
                  {sector.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

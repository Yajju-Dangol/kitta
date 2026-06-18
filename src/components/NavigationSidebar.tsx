import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  BarChart3,
  ListFilter,
  Layers,
  User,
  ShieldCheck,
  ChevronsUpDown,
  UserCog,
  Blocks,
  Plus,
  Settings,
  UserCircle,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  currentView: 'dashboard' | 'drilldown' | 'watchlist' | 'sandbox';
  onViewChange: (view: 'dashboard' | 'drilldown' | 'watchlist' | 'sandbox') => void;
  dbLatency?: number;
}

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "4rem", // Slightly larger to fit our icons nicely
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export default function NavigationSidebar({ currentView, onViewChange, dbLatency = 12 }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Stock Agent', icon: LayoutDashboard },
    { id: 'drilldown', label: 'Stock Details', icon: BarChart3 },
    { id: 'watchlist', label: 'Watchlist', icon: ListFilter },
    { id: 'sandbox', label: 'Sector Trends', icon: Layers },
  ] as const;

  return (
    <motion.div
      className={cn(
        "sidebar z-40 h-full shrink-0 border-r border-[#202024] relative bg-[#09090b] font-sans",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex text-zinc-400 h-full shrink-0 flex-col transition-all`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            {/* Top Header */}
            <div className="flex h-[72px] w-full shrink-0 border-b border-[#202024] p-2 items-center justify-center">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2 px-2 hover:bg-[#141417] hover:text-zinc-200" 
                    >
                      <Avatar className='rounded size-8 bg-[#10B981]/10 text-[#10B981]'>
                        <AvatarFallback className="bg-transparent font-bold">K</AvatarFallback>
                      </Avatar>
                      <motion.li
                        variants={variants}
                        className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed && (
                          <>
                            <div className="flex flex-col items-start ml-1">
                              <p className="text-lg font-extrabold tracking-tight text-white leading-none">
                                Kitta<span className="text-[#10B981]">.</span>
                              </p>
                            </div>
                            <ChevronsUpDown className="h-4 w-4 ml-2 text-zinc-600" />
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-[#141417] border-[#202024] text-zinc-300">
                    <DropdownMenuItem className="hover:bg-[#202024] focus:bg-[#202024]">
                      <span className="flex items-center gap-2 text-xs">
                         <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
                         Active Feed Connection (Live)
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex h-full w-full flex-col mt-4">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('new-chat'))}
                      className={cn(
                        "flex h-10 w-full flex-row items-center rounded-md transition-all mb-4",
                        "bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 border border-[#10B981]/20",
                        isCollapsed ? "justify-center px-0" : "px-2.5 justify-start"
                      )}
                    >
                      <Plus className="h-[18px] w-[18px] shrink-0" />
                      <motion.li variants={variants} className={cn("list-none", isCollapsed ? "hidden" : "flex-1")}>
                        <p className="ml-3 text-sm font-medium text-left">New Chat</p>
                      </motion.li>
                    </button>
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onViewChange(item.id)}
                          className={cn(
                            "flex h-10 w-full flex-row items-center rounded-md transition-all",
                            isActive 
                              ? "bg-[#141417] text-[#10B981] border border-[#202024]" 
                              : "text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-[#141417]/40",
                            isCollapsed ? "justify-center px-0" : "px-2.5 justify-start"
                          )}
                        >
                          <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#10B981]" : "")} />
                          <motion.li variants={variants} className={cn(isCollapsed ? "hidden" : "flex-1")}>
                            <p className="ml-3 text-sm font-medium text-left">{item.label}</p>
                          </motion.li>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Bottom Profile Section */}
              <div className="flex flex-col p-2 border-t border-[#202024] bg-[#0c0c0e]">
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-12 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-[#141417] hover:text-zinc-200">
                        <Avatar className="size-8 rounded-full border border-zinc-800 shrink-0">
                          <AvatarFallback className="bg-zinc-900 text-zinc-400">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <>
                              <div className="flex flex-col text-left ml-1 min-w-0">
                                <span className="text-xs font-semibold text-zinc-300 truncate">yajjudangol1@gmail.com</span>
                                <span className="text-[9px] text-[#10B981] uppercase tracking-widest font-mono flex items-center space-x-1">
                                  <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">Verified</span>
                                </span>
                              </div>
                              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-zinc-600" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5} className="bg-[#141417] border-[#202024] text-zinc-300">
                      <DropdownMenuItem className="hover:bg-[#202024] focus:bg-[#202024] flex items-center gap-2">
                         <LogOut className="h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}

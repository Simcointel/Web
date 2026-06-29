import React from 'react';
import { Link, useLocation } from "../router";
import { useTheme } from "../hooks/useTheme";
import { cn } from "../utils/cn";
import {
  LayoutDashboard, Globe, Briefcase, DollarSign,
  TrendingUp, BookOpen, Share2, Sun, Moon,
  Bell, Info, LayoutGrid, ChevronRight
} from "lucide-react";

const navLinks = [
  { group: "ANALYZE", links: [
    { to: "/", label: "Overview", icon: LayoutDashboard, color: "text-sky-600" },
    { to: "/macro", label: "Macro", icon: Globe, color: "text-violet-600" },
    { to: "/profit-margins", label: "Margins", icon: DollarSign, color: "text-emerald-600" },
  ]},
  { group: "MANAGE", links: [
    { to: "/corporate-suite", label: "Corporate", icon: Briefcase, color: "text-amber-600" },
    { to: "/alerts", label: "Logs", icon: Bell, color: "text-rose-600" },
  ]},
  { group: "INTEL", links: [
    { to: "/vwap-inflation", label: "Trends", icon: TrendingUp, color: "text-sky-600" },
    { to: "/encyclopedia", label: "Registry", icon: BookOpen, color: "text-indigo-600" },
    { to: "/production-flow", label: "Visual", icon: Share2, color: "text-violet-600" },
  ]}
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-900/20 group-hover:scale-110 transition-transform">
            <LayoutGrid size={18} />
          </div>
          <span className="font-black text-lg tracking-tight dark:text-white italic uppercase">
            SIMCO.<span className="text-sky-600">MATRIX</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
        {navLinks.map((group) => (
          <div key={group.group} className="space-y-2">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-60">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.links.map((link) => {
                const active = location === link.to;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center justify-between group px-4 py-2.5 rounded-xl transition-all duration-200",
                      active
                        ? "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={cn("transition-colors", active ? link.color : "text-slate-400 group-hover:text-slate-600")} />
                      <span className="text-xs font-bold uppercase tracking-wide">{link.label}</span>
                    </div>
                    {active && <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-1 duration-300" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-800">
         <DarkModeToggle />
         <div className="flex items-center justify-between px-3 mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol v2.5.0</span>
            <Link to="/about" className="text-slate-400 hover:text-sky-600 transition-colors">
               <Info size={14} />
            </Link>
         </div>
      </div>
    </div>
  );
}

function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between w-full p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-500/30 transition-all group"
    >
      <div className={cn(
         "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-500 shadow-sm",
         theme === 'dark' ? "bg-slate-700 text-amber-400" : "bg-white text-sky-600"
      )}>
         {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pr-4">
         {theme === 'dark' ? 'Nightfall' : 'Daylight'}
      </span>
    </button>
  );
}

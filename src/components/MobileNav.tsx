import React from 'react';
import { Link, useLocation } from "../router";
import { cn } from "../utils/cn";
import { LayoutDashboard, Globe, Briefcase, DollarSign, TrendingUp } from "lucide-react";

export function MobileNav() {
  const location = useLocation();

  const links = [
    { to: "/", icon: LayoutDashboard, label: "Hub" },
    { to: "/macro", icon: Globe, label: "Market" },
    { to: "/corporate-suite", icon: Briefcase, label: "Suite" },
    { to: "/profit-margins", icon: DollarSign, label: "Yields" },
    { to: "/vwap-inflation", icon: TrendingUp, label: "Trends" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-ui border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-[100] safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        const active = location === link.to;
        const Icon = link.icon;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
               "flex flex-col items-center gap-1 transition-all duration-300",
               active ? "text-sky-600 scale-110" : "text-slate-400"
            )}
          >
            <div className={cn(
               "p-2 rounded-xl transition-all duration-300",
               active ? "bg-sky-600 text-white shadow-lg shadow-sky-500/30" : "hover:bg-slate-100 dark:hover:bg-slate-800"
            )}>
               <Icon size={20} />
            </div>
            {active && (
               <span className="text-[9px] font-black uppercase tracking-tighter animate-in fade-in slide-in-from-bottom-1">
                  {link.label}
               </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

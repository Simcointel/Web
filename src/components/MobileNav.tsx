import { Link, useLocation } from "../router";
import { LayoutDashboard, Globe, Briefcase, DollarSign, TrendingUp } from "lucide-react";

export function MobileNav() {
  const location = useLocation();

  const links = [
    { to: "/", icon: <LayoutDashboard size={22} />, label: "Dashboard" },
    { to: "/macro", icon: <Globe size={22} />, label: "Market" },
    { to: "/corporate-suite", icon: <Briefcase size={22} />, label: "Suite" },
    { to: "/profit-margins", icon: <DollarSign size={22} />, label: "Profits" },
    { to: "/vwap-inflation", icon: <TrendingUp size={22} />, label: "Trends" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-t border-surface-200 dark:border-surface-800 px-4 py-2 flex justify-between items-center z-[100] safe-area-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      {links.map((link) => {
        const active = location === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${active ? "text-brand-600 dark:text-brand-400 scale-110" : "text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"}`}
          >
            <div className={`${active ? "bg-brand-600 text-white p-2 rounded-xl shadow-lg shadow-brand-500/20" : ""}`}>
               {link.icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? "opacity-100" : "opacity-0 h-0"}`}>
               {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

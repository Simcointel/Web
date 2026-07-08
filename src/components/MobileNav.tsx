import { Link, useLocation } from "../router";
import { LayoutDashboard, Globe, Briefcase, DollarSign, TrendingUp, Store, HardHat, BarChart3, Zap, Building2 } from "lucide-react";

export function MobileNav() {
  const location = useLocation();

  const links = [
    { to: "/", icon: <LayoutDashboard size={22} />, label: "Home" },
    { to: "/corporate-suite", icon: <Briefcase size={22} />, label: "Suite" },
    { to: "/market-intel", icon: <BarChart3 size={22} />, label: "Intel" },
    { to: "/board-room", icon: <Building2 size={22} />, label: "Board" },
    { to: "/profit-margins", icon: <DollarSign size={22} />, label: "Profits" },
    { to: "/retail-calculator", icon: <Store size={22} />, label: "Retail" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 px-4 py-2 flex justify-between items-center z-[100] safe-area-bottom shadow">
      {links.map((link) => {
        const active = location === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 ${active ? "text-brand-600" : "text-surface-400"}`}
          >
            <div className={`${active ? "text-brand-600 scale-110 transition-transform" : ""}`}>
               {link.icon}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? "opacity-100" : "opacity-60"}`}>
               {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

import { Link, useLocation } from "../router";
import { LayoutDashboard, Briefcase, BarChart3, Building2, DollarSign, Store } from "lucide-react";

export function MobileNav() {
  const location = useLocation();

  const links = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Home" },
    { to: "/corporate-suite", icon: <Briefcase size={20} />, label: "Suite" },
    { to: "/market-intel", icon: <BarChart3 size={20} />, label: "Intel" },
    { to: "/board-room", icon: <Building2 size={20} />, label: "Board" },
    { to: "/profit-margins", icon: <DollarSign size={20} />, label: "Margins" },
    { to: "/retail-calculator", icon: <Store size={20} />, label: "Retail" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 px-2 py-1.5 flex justify-between items-center z-[100] safe-area-bottom shadow-lg">
      {links.map((link) => {
        const active = location === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`relative flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
              active ? "text-brand-600" : "text-surface-400"
            }`}
          >
            {active && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 rounded-full" />
            )}
            <div className={`${active ? "scale-110 transition-transform" : ""}`}>
               {link.icon}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wide truncate w-full text-center ${
              active ? "opacity-100" : "opacity-60"
            }`}>
               {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

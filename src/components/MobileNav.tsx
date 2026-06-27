import { Link, useLocation } from "../router";
import { LayoutDashboard, Globe, Briefcase, DollarSign, TrendingUp } from "lucide-react";

export function MobileNav() {
  const location = useLocation();

  const links = [
    { to: "/", icon: <LayoutDashboard size={18} />, label: "DASH" },
    { to: "/macro", icon: <Globe size={18} />, label: "MACRO" },
    { to: "/corporate-suite", icon: <Briefcase size={18} />, label: "EXEC" },
    { to: "/profit-margins", icon: <DollarSign size={18} />, label: "PROF" },
    { to: "/vwap-inflation", icon: <TrendingUp size={18} />, label: "VWAP" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-900 px-2 py-1 flex justify-between items-center z-[100] safe-area-bottom">
      {links.map((link) => {
        const active = location === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${active ? "text-surface-900 dark:text-white" : "text-surface-400"}`}
          >
            {link.icon}
            <span className="text-[8px] font-black tracking-tighter uppercase">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

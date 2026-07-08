import { Link, useLocation } from "../router";
import { useTheme } from "../hooks/useTheme";
import {
  LayoutDashboard, Globe, Briefcase, DollarSign,
  TrendingUp, BookOpen, Share2, Sun, Moon,
  Bell, Settings, Info, Menu, X, ChevronRight, LayoutGrid,
  Calculator, HardHat, UserCheck, Store
} from "lucide-react";

const navLinks = [
  { group: "ANALYZE", links: [
    { to: "/", label: "Overview", icon: <LayoutDashboard size={18} />, color: "text-brand-500" },
    { to: "/macro", label: "Macro", icon: <Globe size={18} />, color: "text-violet-500" },
    { to: "/profit-margins", label: "Margins", icon: <DollarSign size={18} />, color: "text-emerald-500" },
  ]},
  { group: "MANAGE", links: [
    { to: "/corporate-suite", label: "Corporate", icon: <Briefcase size={18} />, color: "text-amber-500" },
    { to: "/alerts", label: "Logs", icon: <Bell size={18} />, color: "text-rose-500" },
  ]},
  { group: "INTEL", links: [
    { to: "/vwap-inflation", label: "Trends", icon: <TrendingUp size={18} />, color: "text-brand-500" },
    { to: "/encyclopedia", label: "Registry", icon: <BookOpen size={18} />, color: "text-indigo-500" },
  ]},
  { group: "TOOLS", links: [
    { to: "/profit-calculator", label: "Profit Calc", icon: <Calculator size={18} />, color: "text-emerald-500" },
    { to: "/retail-calculator", label: "Retail Calc", icon: <Store size={18} />, color: "text-cyan-500" },
    { to: "/construction-calculator", label: "Construction", icon: <HardHat size={18} />, color: "text-amber-500" },
    { to: "/executive-optimizer", label: "Exec Optimizer", icon: <UserCheck size={18} />, color: "text-violet-500" },
  ]}
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-950/60 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800
        transition-all duration-200 lg:translate-x-0 lg:static lg:block
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <LayoutGrid size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight dark:text-white">
                Simco<span className="text-brand-600">Intel</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
            {navLinks.map((group) => (
              <div key={group.group}>
                <h3 className="px-4 text-xs font-bold uppercase tracking-widest text-surface-400 mb-3">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const active = location === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        aria-current={active ? "page" : undefined}
                        className={`
                          flex items-center gap-4 group px-4 py-2.5 rounded-xl transition-all duration-150
                          ${active
                            ? "bg-brand-600 text-white shadow-sm"
                            : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-900"}
                        `}
                      >
                        <div className={`${active ? "text-white" : "text-surface-400 dark:text-surface-500 group-hover:text-brand-600"} transition-colors`}>
                          {link.icon}
                        </div>
                        <span className={`text-sm font-bold ${active ? "text-white" : ""}`}>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-6 space-y-4">
             <DarkModeToggle />
             <div className="flex items-center justify-between px-4">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">v3.0.0-straight</span>
                <Link to="/about" aria-label="About SimcoIntel" className="text-surface-400 hover:text-brand-600 transition-colors"><Info size={18} /></Link>
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-100 transition-all group"
    >
      <div className="shrink-0 text-surface-500 group-hover:text-brand-600">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </div>
      <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
         {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
}

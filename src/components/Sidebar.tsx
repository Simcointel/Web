import { Link, useLocation } from "../router";
import { useTheme } from "../hooks/useTheme";
import {
  LayoutDashboard, Globe, Briefcase, DollarSign,
  TrendingUp, BookOpen, Bell, Info,
  Sun, Moon, ChevronRight, LayoutGrid,
  Calculator, HardHat, Store, BarChart3, Zap, Building2
} from "lucide-react";

const navLinks = [
  { group: "ANALYZE", links: [
    { to: "/", label: "Overview", icon: <LayoutDashboard size={18} /> },
    { to: "/macro", label: "Macro", icon: <Globe size={18} /> },
    { to: "/profit-margins", label: "Margins", icon: <DollarSign size={18} /> },
  ]},
  { group: "MANAGE", links: [
    { to: "/corporate-suite", label: "Corporate", icon: <Briefcase size={18} /> },
    { to: "/alerts", label: "Logs", icon: <Bell size={18} /> },
  ]},
  { group: "INTEL", links: [
    { to: "/vwap-inflation", label: "Trends", icon: <TrendingUp size={18} /> },
    { to: "/encyclopedia", label: "Registry", icon: <BookOpen size={18} /> },
    { to: "/market-intel", label: "Market Intel", icon: <BarChart3 size={18} /> },
    { to: "/board-room", label: "Board Room", icon: <Building2 size={18} /> },
  ]},
  { group: "TOOLS", links: [
    { to: "/profit-calculator", label: "Profit Calc", icon: <Calculator size={18} /> },
    { to: "/retail-calculator", label: "Retail Calc", icon: <Store size={18} /> },
    { to: "/construction-calculator", label: "Construction", icon: <HardHat size={18} /> },
    { to: "/xp-calculator", label: "XP Calculator", icon: <Zap size={18} /> },
  ]},
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-surface-950/60 z-40 lg:hidden animate-fade-in" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-surface-950 border-r border-surface-200 dark:border-surface-800
        transition-all duration-200 lg:translate-x-0 lg:sticky lg:block lg:h-screen overflow-y-auto
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 shrink-0 flex items-center px-5 border-b border-surface-100 dark:border-surface-800">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setIsOpen(false)}>
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <LayoutGrid size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight dark:text-white">
                Simco<span className="text-brand-600">Intel</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
            {navLinks.map((group, gi) => (
              <div key={group.group}>
                {gi > 0 && <div className="nav-group-divider mb-4" />}
                <h3 className="nav-group-header">{group.group}</h3>
                <div className="space-y-0.5">
                  {group.links.map((link) => {
                    const active = location === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`sidebar-link group ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
                      >
                        <span className={`shrink-0 transition-colors ${active ? 'sidebar-icon-active' : 'sidebar-icon-inactive'}`}>
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                        {active && <ChevronRight size={14} className="ml-auto text-white/50" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-surface-100 dark:border-surface-800 px-3 py-3 space-y-2.5">
            <DarkModeToggle />
            <div className="flex items-center justify-between px-4">
              <span className="stat-label">v3.0.0</span>
              <Link to="/about" aria-label="About" className="text-surface-400 hover:text-brand-600 transition-colors">
                <Info size={15} />
              </Link>
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
      className="flex items-center gap-3 w-full px-4 py-3 bg-surface-50 dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all group"
    >
      <span className={`shrink-0 ${theme === 'dark' ? 'text-amber-400' : 'text-surface-400'} group-hover:text-brand-600 transition-colors`}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
}

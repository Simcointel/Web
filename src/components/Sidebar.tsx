import { Link, useLocation } from "../router";
import { useTheme } from "../hooks/useTheme";
import {
  LayoutDashboard, Globe, Briefcase, DollarSign,
  TrendingUp, BookOpen, Share2, Sun, Moon,
  Bell, Settings, Info, Menu, X, ChevronRight, LayoutGrid
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
    { to: "/production-flow", label: "Visual", icon: <Share2 size={18} />, color: "text-violet-500" },
  ]}
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-950/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-56 bg-white dark:bg-surface-950 border-r border-surface-100 dark:border-surface-900
        transition-all duration-200 lg:translate-x-0 lg:static lg:block
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-12 flex items-center px-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <LayoutGrid size={14} />
              </div>
              <span className="font-black text-lg tracking-tight dark:text-white italic uppercase">
                S<span className="text-brand-600">.Matrix</span>
              </span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-hide">
            {navLinks.map((group) => (
              <div key={group.group}>
                <h3 className="px-3 text-[9px] font-black uppercase tracking-[0.3em] text-surface-300 dark:text-surface-700 mb-1">
                  {group.group}
                </h3>
                <div className="space-y-0.5">
                  {group.links.map((link) => {
                    const active = location === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`
                          flex items-center gap-3 group px-3 py-1.5 rounded transition-all duration-150
                          ${active
                            ? "bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm"
                            : "text-surface-500 hover:bg-surface-50/50 dark:hover:bg-surface-900/50"}
                        `}
                      >
                        <div className={`${active ? link.color : "text-surface-300 dark:text-surface-600 group-hover:text-surface-400"} transition-colors`}>
                          {link.icon}
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-tight ${active ? "text-surface-900 dark:text-white" : "text-surface-400"}`}>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 space-y-3">
             <DarkModeToggle />
             <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest opacity-50">v2.5.0-vibrant</span>
                <Link to="/about" className="text-surface-400 hover:text-brand-500 transition-colors"><Info size={14} /></Link>
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
      className="flex items-center justify-between w-full px-4 py-3 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-200/50 dark:border-surface-700/50 hover:border-brand-500/30 transition-all group"
    >
      <div className="flex items-center gap-3">
        {theme === 'dark' ? (
          <div className="p-1.5 bg-brand-500/10 rounded-lg text-brand-400"><Sun size={18} /></div>
        ) : (
          <div className="p-1.5 bg-brand-600 text-white rounded-lg shadow-md shadow-brand-500/20"><Moon size={18} /></div>
        )}
        <span className="text-xs font-black uppercase tracking-widest text-surface-700 dark:text-surface-300">
           {theme === 'dark' ? 'Daylight' : 'Nightfall'}
        </span>
      </div>
      <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-brand-500' : 'bg-surface-300'}`}>
         <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-5' : 'left-1'}`} />
      </div>
    </button>
  );
}

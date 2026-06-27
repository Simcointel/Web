import { Link, useLocation } from "../router";
import { useTheme } from "../hooks/useTheme";
import {
  LayoutDashboard, Globe, Briefcase, DollarSign,
  TrendingUp, BookOpen, Share2, Sun, Moon,
  Bell, Settings, Info, Menu, X, ChevronRight
} from "lucide-react";

const navLinks = [
  { group: "Analysis", links: [
    { to: "/", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { to: "/macro", label: "Economics", icon: <Globe size={20} /> },
    { to: "/profit-margins", label: "Profitability", icon: <DollarSign size={20} /> },
  ]},
  { group: "Management", links: [
    { to: "/corporate-suite", label: "Corporate Suite", icon: <Briefcase size={20} /> },
    { to: "/alerts", label: "System Logs", icon: <Bell size={20} /> },
  ]},
  { group: "Intelligence", links: [
    { to: "/vwap-inflation", label: "Market Trends", icon: <TrendingUp size={20} /> },
    { to: "/encyclopedia", label: "Encyclopedia", icon: <BookOpen size={20} /> },
    { to: "/production-flow", label: "Supply Chain", icon: <Share2 size={20} /> },
  ]}
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-900/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800
        transition-all duration-300 lg:translate-x-0 lg:static lg:block
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-20 flex items-center px-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 gradient-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={22} />
              </div>
              <span className="font-black text-xl tracking-tight dark:text-white uppercase italic">
                Simco<span className="text-brand-600">Intel</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
            {navLinks.map((group) => (
              <div key={group.group}>
                <h3 className="px-4 text-[11px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-500 mb-3">
                  {group.group}
                </h3>
                <div className="space-y-1.5">
                  {group.links.map((link) => {
                    const active = location === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`
                          flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200
                          ${active
                            ? "bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-sm"
                            : "text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/50 hover:text-surface-900 dark:hover:text-white"}
                        `}
                      >
                        <div className="flex items-center gap-4">
                           <div className={`${active ? "text-brand-600 dark:text-brand-400 scale-110" : "opacity-50 group-hover:opacity-100 group-hover:scale-110"} transition-all duration-200`}>
                             {link.icon}
                           </div>
                           <span className="text-sm font-bold tracking-tight">{link.label}</span>
                        </div>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_#0ea5e9]" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6 space-y-4">
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

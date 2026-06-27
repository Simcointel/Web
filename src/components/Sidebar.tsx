import { Link, useLocation } from "../router";
import { useTheme } from "../hooks/useTheme";

const navLinks = [
  { group: "Monitor", links: [
    { to: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { to: "/macro", label: "Economics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  ]},
  { group: "Corporate", links: [
    { to: "/corporate-suite", label: "Executive Suite", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { to: "/profit-margins", label: "Profitability", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  ]},
  { group: "Intelligence", links: [
    { to: "/vwap-inflation", label: "VWAP & Inflation", icon: "M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z M12 2a10 10 0 100 20 10 10 0 000-20z" },
    { to: "/encyclopedia", label: "Encyclopedia", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { to: "/production-flow", label: "Production Flow", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  ]}
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-60 bg-white dark:bg-surface-950 border-r border-surface-200 dark:border-surface-900
        transition-transform duration-200 lg:translate-x-0 lg:static lg:block
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center px-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-6 h-6 bg-surface-900 dark:bg-white flex items-center justify-center text-white dark:text-surface-950 text-[10px] font-black">SI</div>
              <span className="font-black text-sm tracking-tight dark:text-white uppercase">SimcoIntel</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-6 scrollbar-hide">
            {navLinks.map((group) => (
              <div key={group.group}>
                <h3 className="px-2 text-[9px] font-black uppercase tracking-widest text-surface-400 dark:text-surface-600 mb-2">
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
                          flex items-center gap-3 px-2 py-1.5 text-xs font-bold rounded transition-all duration-150
                          ${active
                            ? "bg-surface-900 text-white dark:bg-white dark:text-surface-950"
                            : "text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-900"}
                        `}
                      >
                        <svg className={`w-4 h-4 ${active ? "opacity-100" : "opacity-40"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                        </svg>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 flex flex-col gap-2">
             <DarkModeToggle />
             <div className="text-[8px] text-surface-400 font-mono text-center uppercase tracking-tighter opacity-50">
               Build v2.4.0-alpha.1
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
      className="flex items-center justify-center w-full py-2 border border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
    >
      <div className="flex items-center gap-2">
        {theme === 'dark' ? (
          <svg className="w-3.5 h-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
        <span className="text-[10px] font-black uppercase tracking-widest text-surface-600 dark:text-surface-400">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </div>
    </button>
  );
}

import { Link, useLocation } from "../router";
import { useState, useEffect } from "react";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/macro", label: "Macro Economy" },
  { to: "/forecasts", label: "Forecasts" },
  { to: "/signals", label: "Signals" },
  { to: "/cycles", label: "Cycles" },
  { to: "/dependencies", label: "Supply Chain" },
  { to: "/vwap-inflation", label: "VWAP Inflation" },
  { to: "/intelligence", label: "Intelligence" },
  { to: "/alerts", label: "Alerts" },
  { to: "/developers", label: "Developers" },
  { to: "/about", label: "Methodology" },
];

export function Navbar() {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">SI</span>
            <span className="font-semibold text-sm hidden sm:inline">SimcoIntel</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <MobileMenu current={location} />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [current]);
  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 text-gray-600 hover:text-gray-900" aria-label="Menu">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-3 py-2 text-sm rounded-md ${current === link.to ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

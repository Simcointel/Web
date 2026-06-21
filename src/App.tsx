import { useState, useEffect } from "react";
import { Link } from "./router";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { LoadingState } from "./components/States";
import { HomePage } from "./pages/Home";
import { MacroPage } from "./pages/Macro";
import { IntelligencePage } from "./pages/Intelligence";
import { AlertsPage } from "./pages/Alerts";
import { AboutPage } from "./pages/About";
import { VWAPInflationPage } from "./pages/VWAPInflation";
import { ProfitMarginsPage } from "./pages/ProfitMargins";
import { WidgetPage } from "./pages/WidgetRenderer";
import { NotFoundPage } from "./pages/NotFound";
import { CompanyToolsPage } from "./pages/CompanyTools";
import React, { Suspense, lazy } from "react";

const ForecastsPage = lazy(() => import("./pages/Forecasts").then((m) => ({ default: m.ForecastsPage })));
const SignalsPage = lazy(() => import("./pages/Signals").then((m) => ({ default: m.SignalsPage })));
const CyclesPage = lazy(() => import("./pages/Cycles").then((m) => ({ default: m.CyclesPage })));
const DependenciesPage = lazy(() => import("./pages/Dependencies").then((m) => ({ default: m.DependenciesPage })));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState text="Loading..." />}>{children}</Suspense>;
}

export function AppShell({ path }: { path: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isWidget = path.startsWith("/widgets");
  const isCompanyTools = path === "/company-tools";

  const page = path === "/" ? <HomePage />
    : path === "/macro" ? <MacroPage />
    : path === "/intelligence" ? <IntelligencePage />
    : path === "/alerts" ? <AlertsPage />
    : path === "/forecasts" ? <LazyPage><ForecastsPage /></LazyPage>
    : path === "/signals" ? <LazyPage><SignalsPage /></LazyPage>
    : path === "/cycles" ? <LazyPage><CyclesPage /></LazyPage>
    : path === "/dependencies" ? <LazyPage><DependenciesPage /></LazyPage>
    : path === "/company-tools" ? <CompanyToolsPage />
    : path === "/vwap-inflation" ? <VWAPInflationPage />
    : path === "/profit-margins" ? <ProfitMarginsPage />
    : path === "/about" ? <AboutPage />
    : isWidget ? <WidgetPage />
    : <NotFoundPage />;

  if (isWidget) {
    return <main className="bg-transparent">{page}</main>;
  }

  if (isCompanyTools) {
    return (
      <div className="flex flex-col h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
        <header className="h-16 glass border-b border-surface-200 dark:border-surface-800 flex items-center px-6 shrink-0 justify-between">
           <div className="flex items-center gap-4">
              <Link to="/" className="btn btn-secondary py-1 px-3 gap-2 text-xs font-bold uppercase tracking-widest">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 Back to Dashboard
              </Link>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center text-white text-[10px] font-bold">SI</div>
              <span className="font-bold text-sm dark:text-white uppercase tracking-wider">Company Suite</span>
           </div>
           <div className="w-32 flex justify-end">
              {/* Placeholder for user profile or settings */}
           </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {page}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 glass border-b border-surface-200 dark:border-surface-800 flex items-center px-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center text-white text-[10px] font-bold">SI</div>
            <span className="font-bold text-sm dark:text-white uppercase tracking-wider">SimcoIntel</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            {page}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

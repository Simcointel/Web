import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./components/Sidebar";
import { Footer } from "./components/Footer";
import { LoadingState } from "./components/States";
import { HomePage } from "./pages/Home";
import { MacroPage } from "./pages/Macro";
import { IntelligencePage } from "./pages/Intelligence";
import { CorrelationsPage } from "./pages/Correlations";
import { AlertsPage } from "./pages/Alerts";
import { AboutPage } from "./pages/About";
import { DevelopersPage } from "./pages/Developers";
import { PlaygroundPage } from "./pages/Playground";
import { VWAPInflationPage } from "./pages/VWAPInflation";
import { ProfitMarginsPage } from "./pages/ProfitMargins";
import { WidgetPage } from "./pages/WidgetRenderer";
import { NotFoundPage } from "./pages/NotFound";
import { Suspense, lazy } from "react";

const ForecastsPage = lazy(() => import("./pages/Forecasts").then((m) => ({ default: m.ForecastsPage })));
const SignalsPage = lazy(() => import("./pages/Signals").then((m) => ({ default: m.SignalsPage })));
const CyclesPage = lazy(() => import("./pages/Cycles").then((m) => ({ default: m.CyclesPage })));
const DependenciesPage = lazy(() => import("./pages/Dependencies").then((m) => ({ default: m.DependenciesPage })));

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState text="Loading..." />}>{children}</Suspense>;
}

export function AppShell({ path }: { path: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isWidget = path.startsWith("/widgets");

  const page = path === "/" ? <HomePage />
    : path === "/macro" ? <MacroPage />
    : path === "/intelligence" ? <IntelligencePage />
    : path === "/correlations" ? <CorrelationsPage />
    : path === "/alerts" ? <AlertsPage />
    : path === "/forecasts" ? <LazyPage><ForecastsPage /></LazyPage>
    : path === "/signals" ? <LazyPage><SignalsPage /></LazyPage>
    : path === "/cycles" ? <LazyPage><CyclesPage /></LazyPage>
    : path === "/dependencies" ? <LazyPage><DependenciesPage /></LazyPage>
    : path === "/developers" ? <DevelopersPage />
    : path === "/playground" ? <PlaygroundPage />
    : path === "/vwap-inflation" ? <VWAPInflationPage />
    : path === "/profit-margins" ? <ProfitMarginsPage />
    : path === "/about" ? <AboutPage />
    : isWidget ? <WidgetPage />
    : <NotFoundPage />;

  if (isWidget) {
    return <main className="bg-transparent">{page}</main>;
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

import { useState, useEffect, Suspense, lazy } from "react";
import { useTheme } from "./hooks/useTheme";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { Footer } from "./components/Footer";
import { PageErrorBoundary } from "./components/PageErrorBoundary";

const HomePage = lazy(() => import("./pages/Home").then(m => ({ default: m.HomePage })));
const MacroPage = lazy(() => import("./pages/Macro").then(m => ({ default: m.MacroPage })));
const AlertsPage = lazy(() => import("./pages/Alerts").then(m => ({ default: m.AlertsPage })));
const AboutPage = lazy(() => import("./pages/About").then(m => ({ default: m.AboutPage })));
const VWAPInflationPage = lazy(() => import("./pages/VWAPInflation").then(m => ({ default: m.VWAPInflationPage })));
const ProfitMarginsPage = lazy(() => import("./pages/ProfitMargins").then(m => ({ default: m.ProfitMarginsPage })));
const EncyclopediaPage = lazy(() => import("./pages/Encyclopedia").then(m => ({ default: m.EncyclopediaPage })));
const WidgetPage = lazy(() => import("./pages/WidgetRenderer").then(m => ({ default: m.WidgetPage })));
const NotFoundPage = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFoundPage })));
const CorporateSuitePage = lazy(() => import("./pages/CorporateSuite").then(m => ({ default: m.CorporateSuitePage })));
const ProfitCalculatorPage = lazy(() => import("./pages/ProfitCalculator").then(m => ({ default: m.ProfitCalculatorPage })));
const ConstructionCalculatorPage = lazy(() => import("./pages/ConstructionCalculator").then(m => ({ default: m.ConstructionCalculatorPage })));
const RetailCalculatorPage = lazy(() => import("./pages/RetailCalculator").then(m => ({ default: m.RetailCalculatorPage })));
const MarketIntelPage = lazy(() => import("./pages/MarketIntel").then(m => ({ default: m.MarketIntelPage })));
const XpCalculatorPage = lazy(() => import("./pages/XpCalculator").then(m => ({ default: m.XpCalculatorPage })));
const BoardRoomPage = lazy(() => import("./pages/BoardRoom").then(m => ({ default: m.BoardRoomPage })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="flex flex-col items-center gap-3">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Loading</span>
    </div>
  </div>
);

export function AppShell({ path }: { path: string }) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isWidget = path.startsWith("/widgets");
  const isSuite = path === "/corporate-suite";

  const page = path === "/" ? <HomePage />
    : path === "/macro" ? <MacroPage />
    : path === "/alerts" ? <AlertsPage />
    : path === "/corporate-suite" ? <CorporateSuitePage />
    : path === "/vwap-inflation" ? <VWAPInflationPage />
    : path === "/profit-margins" ? <ProfitMarginsPage />
    : path === "/encyclopedia" ? <EncyclopediaPage />
    : path === "/profit-calculator" ? <ProfitCalculatorPage />
    : path === "/construction-calculator" ? <ConstructionCalculatorPage />
    : path === "/executive-optimizer" ? <BoardRoomPage />
    : path === "/retail-calculator" ? <RetailCalculatorPage />
    : path === "/market-intel" ? <MarketIntelPage />
    : path === "/xp-calculator" ? <XpCalculatorPage />
    : path === "/board-room" ? <BoardRoomPage />
    : path === "/about" ? <AboutPage />
    : isWidget ? <WidgetPage />
    : <NotFoundPage />;

  if (isWidget) {
    return <main className="bg-transparent"><Suspense fallback={null}><PageErrorBoundary>{page}</PageErrorBoundary></Suspense></main>;
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''} bg-white dark:bg-surface-950 font-sans`}>
      {!isSuite && (
        <div className="hidden lg:block">
           <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto focus:outline-none custom-scrollbar pb-16 lg:pb-0">
          <div className={`${isSuite ? 'max-w-full px-4 lg:px-8 py-4' : 'max-w-[1440px] mx-auto p-3 sm:p-4 lg:p-6'}`}>
            <Suspense fallback={<LoadingFallback />}>
              <PageErrorBoundary>{page}</PageErrorBoundary>
            </Suspense>
          </div>
          {!isSuite && <Footer />}
        </main>
      </div>

      {!isSuite && <MobileNav />}
    </div>
  );
}

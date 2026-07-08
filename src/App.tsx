import { useState, useEffect, Suspense, lazy } from "react";
import { useTheme } from "./hooks/useTheme";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { Footer } from "./components/Footer";

const HomePage = lazy(() => import("./pages/Home").then(m => ({ default: m.HomePage })));
const MacroPage = lazy(() => import("./pages/Macro").then(m => ({ default: m.MacroPage })));
const AlertsPage = lazy(() => import("./pages/Alerts").then(m => ({ default: m.AlertsPage })));
const AboutPage = lazy(() => import("./pages/About").then(m => ({ default: m.AboutPage })));
const VWAPInflationPage = lazy(() => import("./pages/VWAPInflation").then(m => ({ default: m.VWAPInflationPage })));
const ProfitMarginsPage = lazy(() => import("./pages/ProfitMargins").then(m => ({ default: m.ProfitMarginsPage })));
const EncyclopediaPage = lazy(() => import("./pages/Encyclopedia").then(m => ({ default: m.EncyclopediaPage })));
const ProductionFlowPage = lazy(() => import("./pages/ProductionFlow").then(m => ({ default: m.ProductionFlowPage })));
const WidgetPage = lazy(() => import("./pages/WidgetRenderer").then(m => ({ default: m.WidgetPage })));
const NotFoundPage = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFoundPage })));
const CorporateSuitePage = lazy(() => import("./pages/CorporateSuite").then(m => ({ default: m.CorporateSuitePage })));

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
    : path === "/production-flow" ? <ProductionFlowPage />
    : path === "/about" ? <AboutPage />
    : isWidget ? <WidgetPage />
    : <NotFoundPage />;

  if (isWidget) {
    return <main className="bg-transparent"><Suspense fallback={null}>{page}</Suspense></main>;
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
          <div className={`${isSuite ? 'max-w-full px-4 lg:px-8 py-4' : 'max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-6'}`}>
            <Suspense fallback={<div className="flex items-center justify-center py-20 text-surface-400 font-bold">Loading...</div>}>
              {page}
            </Suspense>
          </div>
          {!isSuite && <Footer />}
        </main>
      </div>

      {!isSuite && <MobileNav />}
    </div>
  );
}

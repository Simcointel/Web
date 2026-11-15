import { useState, useEffect, Suspense, lazy } from "react";
import { useTheme } from "./hooks/useTheme";
import { useMaintenanceMode } from "./hooks/useMaintenanceMode";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { Footer } from "./components/Footer";
import { PageErrorBoundary } from "./components/PageErrorBoundary";
import { MaintenanceOverlay } from "./components/MaintenanceOverlay";

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
const MarketOrdersPage = lazy(() => import("./pages/MarketOrders").then(m => ({ default: m.MarketOrdersPage })));
const GovernmentPage = lazy(() => import("./pages/Government").then(m => ({ default: m.GovernmentPage })));
const XpCalculatorPage = lazy(() => import("./pages/XpCalculator").then(m => ({ default: m.XpCalculatorPage })));
const ExtensionPage = lazy(() => import("./pages/Extension").then(m => ({ default: m.ExtensionPage })));
const SalesOfficeCalculatorPage = lazy(() => import("./pages/SalesOfficeCalculator").then(m => ({ default: m.SalesOfficeCalculatorPage })));
const RetailMechanicsPage = lazy(() => import("./pages/RetailMechanics").then(m => ({ default: m.RetailMechanicsPage })));
const RestaurantPlannerPage = lazy(() => import("./pages/RestaurantPlanner").then(m => ({ default: m.RestaurantPlannerPage })));
const ResourceEncyclopediaPage = lazy(() => import("./pages/ResourceEncyclopedia").then(m => ({ default: m.ResourceEncyclopediaPage })));
const ProductionFlowPage = lazy(() => import("./pages/ProductionFlow").then(m => ({ default: m.ProductionFlowPage })));
const ApiDocsPage = lazy(() => import("./pages/ApiDocs").then(m => ({ default: m.ApiDocsPage })));


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
  const { enabled, title, message, retryAfter, loading, refresh } = useMaintenanceMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isWidget = path.startsWith("/widgets");
  const isSuite = path === "/corporate-suite";

  // Show maintenance overlay if enabled
  if (enabled) {
    return (
      <MaintenanceOverlay
        title={title}
        message={message}
        retryAfter={retryAfter}
        onRetry={refresh}
      />
    );
  }

  // Hold back the page until the flag is known, so no API calls fire during maintenance.
  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'dark' : ''} bg-white dark:bg-surface-950`}>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const page = path === "/" ? <HomePage />
    : path === "/macro" ? <MacroPage />
    : path === "/alerts" ? <AlertsPage />
    : path === "/corporate-suite" ? <CorporateSuitePage />
    : path === "/vwap-inflation" ? <VWAPInflationPage />
    : path === "/profit-margins" ? <ProfitMarginsPage />
    : path === "/encyclopedia" ? <EncyclopediaPage />
    : path === "/profit-calculator" ? <ProfitCalculatorPage />
    : path === "/construction-calculator" ? <ConstructionCalculatorPage />
    : path === "/executive-optimizer" ? <CorporateSuitePage />
    : path === "/retail-calculator" ? <RetailCalculatorPage />
    : path === "/market-intel" ? <MarketIntelPage />
    : path === "/market-orders" ? <MarketOrdersPage />
    : path === "/government" ? <GovernmentPage />
    : path === "/about" ? <AboutPage />
    : path === "/extension" ? <ExtensionPage />
    : path === "/sales-office" ? <SalesOfficeCalculatorPage />
    : path === "/retail-mechanics" ? <RetailMechanicsPage />
    : path === "/restaurant" ? <RestaurantPlannerPage />
    : path === "/resources" ? <ResourceEncyclopediaPage />
    : path === "/xp-calculator" ? <XpCalculatorPage />
    : path === "/production-flow" ? <ProductionFlowPage />
    : path === "/api-docs" ? <ApiDocsPage />
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

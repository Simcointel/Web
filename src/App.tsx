import { useState, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/Home";
import { MacroPage } from "./pages/Macro";
import { AlertsPage } from "./pages/Alerts";
import { AboutPage } from "./pages/About";
import { VWAPInflationPage } from "./pages/VWAPInflation";
import { ProfitMarginsPage } from "./pages/ProfitMargins";
import { EncyclopediaPage } from "./pages/Encyclopedia";
import { ProductionFlowPage } from "./pages/ProductionFlow";
import { WidgetPage } from "./pages/WidgetRenderer";
import { NotFoundPage } from "./pages/NotFound";
import { CorporateSuitePage } from "./pages/CorporateSuite";
import React from "react";

export function AppShell({ path }: { path: string }) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isWidget = path.startsWith("/widgets");

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
    return <main className="bg-transparent">{page}</main>;
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''} bg-white dark:bg-surface-950 font-mono`}>
      <div className="hidden lg:block">
         <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto focus:outline-none custom-scrollbar pb-16 lg:pb-0">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            {page}
          </div>
          <Footer />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

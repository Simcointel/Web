import { useTheme } from "./hooks/useTheme";
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
import { AppLayout } from "./components/ui/Layout";
import React from "react";

export function AppShell({ path }: { path: string }) {
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
    const { theme } = useTheme();
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <main className="bg-transparent">{page}</main>
      </div>
    );
  }

  return (
    <AppLayout path={path}>
      {page}
    </AppLayout>
  );
}

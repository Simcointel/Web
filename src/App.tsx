import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Navbar } from "./components/Navbar";
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
import { WidgetPage } from "./pages/WidgetRenderer";

const ForecastsPage = lazy(() => import("./pages/Forecasts").then((m) => ({ default: m.ForecastsPage })));
const SignalsPage = lazy(() => import("./pages/Signals").then((m) => ({ default: m.SignalsPage })));
const CyclesPage = lazy(() => import("./pages/Cycles").then((m) => ({ default: m.CyclesPage })));
const DependenciesPage = lazy(() => import("./pages/Dependencies").then((m) => ({ default: m.DependenciesPage })));

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingState text="Loading..." />}>{children}</Suspense>;
}

export function AppShell({ path }: { path: string }) {
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
    : path === "/about" ? <AboutPage />
    : isWidget ? <WidgetPage />
    : <HomePage />;

  if (isWidget) {
    return <main className="bg-transparent">{page}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {page}
        </div>
      </main>
      <Footer />
    </div>
  );
}

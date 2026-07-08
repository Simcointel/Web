import React, { useEffect } from "react";
import { SearchParams, useSearchParams } from "../router";
import { WidgetHealthCard } from "../components/widgets/WidgetHealthCard";
import { WidgetAlertList } from "../components/widgets/WidgetAlertList";
import { WidgetRegimeCard } from "../components/widgets/WidgetRegimeCard";
import { WidgetForecastCard } from "../components/widgets/WidgetForecastCard";

type WidgetType = "health" | "alerts" | "regime" | "scores" | "macro" | "forecast" | "signals" | "cycles" | "dependencies";

function queryRealm(params: SearchParams): number {
  const r = params.get("realm");
  return r ? parseInt(r) : 0;
}

function WidgetShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-[8px_10px]">
      {title && <div className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{title}</div>}
      {children}
    </div>
  );
}

export function WidgetPage() {
  useEffect(() => {
    document.title = "SimCo Intel - Widgets";
  }, []);

  const params = useSearchParams();
  const type = (params.get("type") || "health") as WidgetType;
  const realm = queryRealm(params);

  return (
    <div style={{ margin: 0, padding: 0, width: "100%", height: "100%", boxSizing: "border-box" }}>
      {type === "health" && <WidgetShell title="Economic Health"><WidgetHealthCard realm={realm} /></WidgetShell>}
      {type === "alerts" && <WidgetShell title="Recent Alerts"><WidgetAlertList realm={realm} /></WidgetShell>}
      {type === "regime" && <WidgetRegimeCard realm={realm} />}
      {type === "scores" && <WidgetShell title="Composite Scores"><WidgetHealthCard realm={realm} /></WidgetShell>}
      {type === "forecast" && <WidgetShell title="Forecasts"><WidgetForecastCard realm={realm} /></WidgetShell>}
      {type === "signals" && <WidgetShell title="Signals"><div className="text-[10px] text-gray-400 dark:text-gray-500 italic p-2">Not yet available</div></WidgetShell>}
      {type === "cycles" && <WidgetShell title="Cycle"><div className="text-[10px] text-gray-400 dark:text-gray-500 italic p-2">Not yet available</div></WidgetShell>}
      {type === "dependencies" && <WidgetShell title="Dependencies"><div className="text-[10px] text-gray-400 dark:text-gray-500 italic p-2">Not yet available</div></WidgetShell>}
    </div>
  );
}

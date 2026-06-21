import React from "react";
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
    <div style={{
      background: "white",
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      padding: "8px 10px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxSizing: "border-box",
    }}>
      {title && <div style={{ fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{title}</div>}
      {children}
    </div>
  );
}

export function WidgetPage() {
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
      {type === "signals" && <WidgetShell title="Signals">{/* signals compact from widget API */}<WidgetForecastCard realm={realm} /></WidgetShell>}
      {type === "cycles" && <WidgetShell title="Cycle">{/* cycles widget */}<WidgetForecastCard realm={realm} /></WidgetShell>}
      {type === "dependencies" && <WidgetShell title="Dependencies">{/* deps widget */}<WidgetForecastCard realm={realm} /></WidgetShell>}
    </div>
  );
}

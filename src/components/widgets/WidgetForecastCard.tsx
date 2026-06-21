import React, { useState, useEffect } from "react";
import { fetchWidget } from "../../services/widgetClient";

const style: Record<string, React.CSSProperties> = {
  shell: { fontFamily: "system-ui, sans-serif", fontSize: 12, lineHeight: 1.4, color: "#111" },
  header: { fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7280", marginBottom: 8 },
  row: { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f3f4f6" },
  label: { color: "#6b7280" },
  value: { fontFamily: "monospace", fontWeight: 600 },
  bar: { height: 4, borderRadius: 2, marginTop: 2 },
};

export function WidgetForecastCard({ realm = 0, compact = true }: { realm?: number; compact?: boolean }) {
  const [data, setData] = useState<Record<string, { v: number; r: number }> | null>(null);
  useEffect(() => {
    fetchWidget<Record<string, { v: number; r: number }>>("forecast", realm).then((d) => setData(d)).catch(() => {});
    const id = setInterval(() => fetchWidget<Record<string, { v: number; r: number }>>("forecast", realm).then((d) => setData(d)).catch(() => {}), 60000);
    return () => clearInterval(id);
  }, [realm]);
  if (!data) return <div style={style.shell}>Loading forecast...</div>;
  const entries = Object.entries(data).slice(0, 5);
  return (
    <div style={style.shell}>
      <div style={style.header}>Forecast Projections</div>
      {entries.map(([k, v]) => (
        <div key={k} style={style.row}>
          <span style={style.label}>{k}</span>
          <span style={style.value}>{v.v?.toFixed(2) ?? "-"}</span>
        </div>
      ))}
    </div>
  );
}

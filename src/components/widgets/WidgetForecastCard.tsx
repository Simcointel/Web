import React, { useState, useEffect } from "react";
import { fetchWidget } from "../../services/widgetClient";

export function WidgetForecastCard({ realm = 0, compact = true }: { realm?: number; compact?: boolean }) {
  const [data, setData] = useState<Record<string, { v: number; r: number }> | null>(null);
  useEffect(() => {
    const fetch = () => fetchWidget<Record<string, { v: number; r: number }>>("forecast", realm).then((d) => setData(d)).catch(() => setData(null));
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [realm]);
  if (!data) return <div className="text-[12px] leading-[1.4] text-gray-900 dark:text-gray-100">Loading forecast...</div>;
  const entries = Object.entries(data).slice(0, 5);
  return (
    <div className="text-[12px] leading-[1.4] text-gray-900 dark:text-gray-100">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Forecast Projections</div>
      {entries.map(([k, v]) => (
        <div key={k} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
          <span className="text-gray-500 dark:text-gray-400">{k}</span>
          <span className="font-mono font-semibold">{v.v?.toFixed(2) ?? "-"}</span>
        </div>
      ))}
    </div>
  );
}

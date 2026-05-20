import { useEffect, useState } from "react";
import { fetchWidget } from "../../services/widgetClient";
import { SeverityDot } from "../../components/widgets/WidgetParts";

interface CompactAlert {
  t: string;
  s: string;
  c: string;
  i: string;
}

interface CompactAlerts {
  w: string;
  a: CompactAlert[];
  total: number;
}

export function WidgetAlertList({ realm = 0, limit = 5 }: { realm?: number; limit?: number }) {
  const [data, setData] = useState<CompactAlerts | null>(null);

  useEffect(() => {
    fetchWidget<CompactAlerts>("alerts", realm, true).then(setData).catch(() => {});
    const id = setInterval(() => fetchWidget<CompactAlerts>("alerts", realm, true).then(setData).catch(() => {}), 30000);
    return () => clearInterval(id);
  }, [realm, limit]);

  if (!data?.a?.length) return <div style={{ fontSize: 10, color: "#9ca3af", padding: 4 }}>No recent alerts</div>;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 10, lineHeight: 1.4 }}>
      {data.a.slice(0, limit).map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 4, padding: "2px 0", alignItems: "center" }}>
          <SeverityDot severity={a.s} />
          <span style={{ color: "#6b7280", flexShrink: 0 }}>{new Date(a.t).toLocaleTimeString()}</span>
          <span style={{ color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.i}</span>
        </div>
      ))}
    </div>
  );
}

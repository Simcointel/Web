import { useEffect, useState } from "react";
import { fetchWidget } from "../../services/widgetClient";
import { MiniRegimeBadge } from "../../components/widgets/WidgetParts";

interface CompactRegime {
  reg: { na: string; sc: number };
}

export function WidgetRegimeCard({ realm = 0 }: { realm?: number }) {
  const [data, setData] = useState<CompactRegime | null>(null);

  useEffect(() => {
    fetchWidget<CompactRegime>("regime", realm, true).then(setData).catch(() => {});
    const id = setInterval(() => fetchWidget<CompactRegime>("regime", realm, true).then(setData).catch(() => {}), 60000);
    return () => clearInterval(id);
  }, [realm]);

  const reg = data?.reg;
  if (!reg) return <div style={{ fontSize: 10, color: "#9ca3af", padding: 4 }}>No regime data</div>;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", textAlign: "center", padding: 8 }}>
      <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Economic Regime</div>
      <MiniRegimeBadge regime={reg.na} />
      <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 2 }}>Score: {reg.sc}</div>
    </div>
  );
}

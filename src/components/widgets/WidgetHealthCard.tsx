import { useEffect, useState } from "react";
import { fetchWidget } from "../../services/widgetClient";
import type { WidgetScores } from "../../services/widgetClient";
import { MiniScoreBar, MiniRegimeBadge } from "../../components/widgets/WidgetParts";

interface CompactHealth {
  w: string;
  t: string;
  s: WidgetScores;
  r: { na: string; sc: number };
}

export function WidgetHealthCard({ realm = 0, compact = true }: { realm?: number; compact?: boolean }) {
  const [data, setData] = useState<CompactHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWidget<CompactHealth>("health", realm, compact).then(setData).catch((e) => setError(e.message));
    const id = setInterval(() => fetchWidget<CompactHealth>("health", realm, compact).then(setData).catch(() => {}), 30000);
    return () => clearInterval(id);
  }, [realm, compact]);

  if (error) return <div className="text-[10px] text-red-500 p-2">Widget error: {error}</div>;
  if (!data) return <div className="text-[10px] text-gray-400 p-2 animate-pulse">Loading...</div>;

  const scores = data.s;
  const regime = data.r;

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 11, lineHeight: 1.4, color: "#374151" }}>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontWeight: 600, fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Economic Health</span>
        {regime && <MiniRegimeBadge regime={regime.na} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <MiniScoreBar value={scores.eh} />
        <MiniScoreBar value={scores.ms} />
        <MiniScoreBar value={scores.st} />
        <MiniScoreBar value={scores.ip} />
        <MiniScoreBar value={scores.sr} />
      </div>
      <div style={{ fontSize: 8, color: "#9ca3af", marginTop: 4, textAlign: "right" }}>
        {data.t ? new Date(data.t).toLocaleTimeString() : ""}
      </div>
    </div>
  );
}

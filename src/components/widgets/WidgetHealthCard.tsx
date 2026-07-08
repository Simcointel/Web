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
    <div className="text-[11px] leading-[1.4] text-gray-700 dark:text-gray-300">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Economic Health</span>
        {regime && <MiniRegimeBadge regime={regime.na} />}
      </div>
      <div className="flex flex-col gap-0.5">
        <MiniScoreBar value={scores.eh} />
        <MiniScoreBar value={scores.ms} />
        <MiniScoreBar value={scores.st} />
        <MiniScoreBar value={scores.ip} />
        <MiniScoreBar value={scores.sr} />
      </div>
      <div className="text-[8px] text-gray-400 dark:text-gray-500 mt-1 text-right">
        {data.t ? new Date(data.t).toLocaleTimeString() : ""}
      </div>
    </div>
  );
}

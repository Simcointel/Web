import { useEffect, useState } from "react";
import { fetchWidget } from "../../services/widgetClient";
import { MiniRegimeBadge } from "../../components/widgets/WidgetParts";

interface CompactRegime {
  reg: { na: string; sc: number };
}

export function WidgetRegimeCard({ realm = 0 }: { realm?: number }) {
  const [data, setData] = useState<CompactRegime | null>(null);

  useEffect(() => {
    const fetch = () => fetchWidget<CompactRegime>("regime", realm, true).then(setData).catch(() => setData(null));
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [realm]);

  const reg = data?.reg;
  if (!reg) return <div className="text-[10px] text-gray-400 dark:text-gray-500 p-1">No regime data</div>;

  return (
    <div className="text-center p-2">
      <div className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Economic Regime</div>
      <MiniRegimeBadge regime={reg.na} />
      <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">Score: {reg.sc}</div>
    </div>
  );
}

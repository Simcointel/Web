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

  if (!data?.a?.length) return <div className="text-[10px] text-gray-400 dark:text-gray-500 p-1">No recent alerts</div>;

  return (
    <div className="text-[10px] leading-[1.4]">
      {data.a.slice(0, limit).map((a, i) => (
        <div key={i} className="flex gap-1 py-0.5 items-center">
          <SeverityDot severity={a.s} />
          <span className="text-gray-500 dark:text-gray-400 shrink-0">{new Date(a.t).toLocaleTimeString()}</span>
          <span className="text-gray-700 dark:text-gray-300 overflow-hidden text-ellipsis whitespace-nowrap">{a.i}</span>
        </div>
      ))}
    </div>
  );
}

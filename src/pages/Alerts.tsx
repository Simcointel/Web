import { useState, useCallback } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useSharedRealm } from "../hooks/useSharedRealm";

export function AlertsPage() {
  const [realm, setRealm] = useSharedRealm();
  const { data: eventsData, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardEvents(realm, 200), 60000, [realm]);
  const [severity, setSeverity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const connected = useSseConnected();
  const [streamEvents, setStreamEvents] = useState<any[]>([]);

  useSseEvent("alert_generated", useCallback((data: { count?: number }) => {
    if (data?.count && data.count > 0) {
      refresh();
    }
  }, [refresh]));

  const allEvents = (() => {
    const stored = eventsData
    ? (Array.isArray(eventsData) ? eventsData : (eventsData as any).events ?? [])
    : [];
    const merged = [...streamEvents, ...stored];
    return merged.filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i);
  })();

  const categories = [...new Set(allEvents.map((e) => e.ca))].sort();

  const filtered = allEvents.filter((e) => {
    if (severity !== "all" && e.se !== severity) return false;
    if (category !== "all" && e.ca !== category) return false;
    return true;
  });

  if (loading && allEvents.length === 0) return <LoadingState text="Loading events..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Alerts &amp; Event Feed</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {allEvents.length} events &middot;
            <span className={`ml-1 ${connected ? "text-econ-green" : "text-gray-400"}`}>
              {connected ? "Live updates active" : "Polling mode"}
            </span>
          </p>
        </div>
        <select value={realm} onChange={(e) => setRealm(Number(e.target.value))}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700">
          <option value={0}>Realm 0</option>
          <option value={1}>Realm 1</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={refresh} className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50">
          Refresh
        </button>
      </div>

      <Section title="Event Timeline">
        {filtered.length === 0 ? <EmptyState message="No events match the current filters" /> :
        <div className="card divide-y divide-gray-100">
          {filtered.slice(0, 100).map((e) => (
            <div key={e.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <SeverityBadge severity={e.se} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                    <span>{new Date(e.ts).toLocaleString()}</span>
                    <span className="text-gray-300">|</span>
                    <span>{e.ca}</span>
                    {e.re && <><span className="text-gray-300">|</span><span>Realm {e.re}</span></>}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{e.ti}</p>
                  {e.de && <p className="text-xs text-gray-500 mt-0.5">{e.de}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>}
      </Section>
    </div>
  );
}

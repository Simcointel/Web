import { useState, useMemo, useEffect } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { NormalizedEvent, EventsResponse } from "../types/api";

export function AlertsPage() {
  useEffect(() => {
    document.title = "Event Logs - SimcoIntel";
  }, []);

  const [realm] = useSharedRealm();
  const { data: eventsData, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardEvents(realm, 200), 60000, [realm]);
  const [severity, setSeverity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const allEvents: NormalizedEvent[] = eventsData
    ? (eventsData as EventsResponse).events ?? []
    : [];

  const categories = [...new Set(allEvents.map((e) => e.ca))].sort();

  const filtered = allEvents.filter((e) => {
    if (severity !== "all" && e.se !== severity) return false;
    if (category !== "all" && e.ca !== category) return false;
    return true;
  });

  const loadingOrError = useMemo(() => {
    if (loading && allEvents.length === 0) return <LoadingState text="SYNC_LOGS..." />;
    if (error) return <ErrorState message={error} onRetry={refresh} />;
    return null;
  }, [loading, allEvents.length, error, refresh]);

  if (loadingOrError) return loadingOrError;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-xl font-bold italic tracking-tight">Intelligence Event Log (R{realm})</h1>
          <p className="text-sm text-surface-500 mt-1 font-medium">
            {allEvents.length} events analyzed &middot; <span className="text-surface-400 font-bold">POLLING 60s</span>
          </p>
        </div>
        <div className="flex gap-3">
           <select
             value={severity}
             onChange={(e) => setSeverity(e.target.value)}
             className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-bold px-3 py-1.5 rounded-lg outline-none"
           >
             <option value="all">All Severities</option>
             <option value="critical">Critical</option>
             <option value="warning">Warning</option>
             <option value="info">Information</option>
           </select>
           <select
             value={category}
             onChange={(e) => setCategory(e.target.value)}
             className="bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 text-sm font-bold px-3 py-1.5 rounded-lg outline-none"
           >
             <option value="all">All Categories</option>
             {categories.map((c) => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </div>

      <div className="card !shadow-none border-surface-200 dark:border-surface-800 overflow-hidden">
        {filtered.length === 0 ? <EmptyState message="No events match your current filter." /> :
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {filtered.slice(0, 100).map((e) => (
            <div key={e.id} className="px-6 py-4 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors flex items-center gap-8">
               <div className={`w-3 h-3 rounded-full shrink-0 ${e.se === 'critical' ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]' : e.se === 'warning' ? 'bg-amber-500' : 'bg-brand-500'}`} />
               <span className="text-surface-400 font-medium shrink-0 w-24">{new Date(e.ts).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'})}</span>
               <span className="text-surface-500 font-bold uppercase text-xs shrink-0 w-32 truncate">{e.ca}</span>
               <span className="font-bold text-surface-900 dark:text-white truncate flex-1 text-base italic">{e.ti}</span>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

import { useState, useCallback, useMemo } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";

export function AlertsPage() {
  const [realm, setRealm] = useSharedRealm();
  const { data: eventsData, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardEvents(realm, 200), 60000, [realm]);
  const [severity, setSeverity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const connected = useSseConnected();

  useSseEvent("alert_generated", useCallback(() => {
      refresh();
  }, [refresh]));

  const allEvents = (() => {
    return eventsData
    ? (Array.isArray(eventsData) ? eventsData : (eventsData as any).events ?? [])
    : [];
  })();

  const categories = [...new Set(allEvents.map((e: any) => e.ca))].sort();

  const filtered = allEvents.filter((e: any) => {
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
    <div className="space-y-6 font-mono text-[10px]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">Event_Log_R{realm}</h1>
          <p className="text-[10px] text-surface-500 mt-0.5 font-bold uppercase opacity-60">
            {allEvents.length} Entries Recorded &middot; {connected ? "LINK_ACTIVE" : "POLLING"}
          </p>
        </div>
        <div className="flex gap-2">
           <select
             value={severity}
             onChange={(e) => setSeverity(e.target.value)}
             className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] font-black px-2 py-1 outline-none uppercase"
           >
             <option value="all">ALL_SEVERITIES</option>
             <option value="critical">CRITICAL</option>
             <option value="warning">WARNING</option>
             <option value="info">INFO</option>
           </select>
           <select
             value={category}
             onChange={(e) => setCategory(e.target.value)}
             className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] font-black px-2 py-1 outline-none uppercase"
           >
             <option value="all">ALL_CATEGORIES</option>
             {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </div>

      <div className="border border-surface-200 dark:border-surface-800">
        {filtered.length === 0 ? <EmptyState message="NO_MATCHING_EVENTS" /> :
        <div className="divide-y divide-surface-100 dark:divide-surface-900">
          {filtered.slice(0, 100).map((e: any) => (
            <div key={e.id} className="px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors flex items-center gap-6">
               <span className={`w-2 h-2 shrink-0 ${e.se === 'critical' ? 'bg-red-600' : e.se === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`} />
               <span className="opacity-40 shrink-0 w-24">{new Date(e.ts).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
               <span className="opacity-60 uppercase font-bold shrink-0 w-24 truncate">{e.ca}</span>
               <span className="font-black uppercase truncate flex-1">{e.ti}</span>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

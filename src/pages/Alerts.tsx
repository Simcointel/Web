import { useState, useCallback } from "react";
import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { useSharedRealm } from "../hooks/useSharedRealm";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { History, Filter, Search, ShieldAlert } from "lucide-react";

export function AlertsPage() {
  const [realm] = useSharedRealm();
  const { data: eventsData, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardEvents(realm, 200), 60000, [realm]);
  const [severity, setSeverity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState("");
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
    if (q && !e.ti.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  if (loading && allEvents.length === 0) return <LoadingState text="Accessing Event Archive..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Event.<span className="text-sky-600">Archive</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Immutable ledger of algorithmic market signals.</p>
        </div>

        <div className="flex items-center gap-4">
           <Badge variant={connected ? 'success' : 'neutral'} dot>
              {connected ? 'LIVE_STREAM_ACTIVE' : 'IDLE'}
           </Badge>
           <Badge variant="neutral" className="tabular-nums">
              {allEvents.length} RECORDS
           </Badge>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
               <Input
                  placeholder="Filter by event title..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  icon={Search}
                  className="bg-white dark:bg-slate-900"
               />
            </div>
            <div className="flex gap-2">
               <select
                 value={severity}
                 onChange={(e) => setSeverity(e.target.value)}
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none"
               >
                 <option value="all">All Severities</option>
                 <option value="critical">Critical</option>
                 <option value="warning">Warning</option>
                 <option value="info">Info</option>
               </select>
               <select
                 value={category}
                 onChange={(e) => setCategory(e.target.value)}
                 className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold outline-none"
               >
                 <option value="all">All Categories</option>
                 {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
         </div>

         <div className="divide-y divide-slate-50 dark:divide-slate-800">
           {filtered.length === 0 ? <EmptyState message="No matching event signals found." /> :
           filtered.slice(0, 100).map((e: any) => (
             <div key={e.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center gap-4 group">
                <div className="flex items-center gap-4 shrink-0 w-48">
                   <div className={`w-2 h-2 rounded-full ${e.se === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : e.se === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'}`} />
                   <span className="text-[11px] font-mono text-slate-400 font-bold tracking-tight">
                      {new Date(e.ts).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                   </span>
                   <Badge variant="neutral" className="text-[9px] opacity-60">{e.ca}</Badge>
                </div>
                <div className="flex-1">
                   <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic group-hover:text-sky-600 transition-colors">
                      {e.ti}
                   </p>
                </div>
             </div>
           ))}
         </div>
      </Card>
    </div>
  );
}

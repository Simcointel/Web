import { useDataRepoPoll } from "../hooks/useDataRepo";
import * as dataRepo from "../services/dataRepo";
import { useSseConnected, useSseEvent } from "../hooks/useSse";
import { StatCard } from "../components/StatCard";
import { MiniSparkline } from "../components/MiniSparkline";
import { motion } from "framer-motion";
import { Section } from "../components/Layout";
import { LoadingState, ErrorState } from "../components/States";
import { SeverityBadge } from "../components/SeverityBadge";
import { useCallback } from "react";
import { useSharedRealm } from "../hooks/useSharedRealm";
import type { RealmDashboard } from "../types/api";
import { Link } from "../router";
import { Briefcase, Factory, ShoppingCart, Construction, Users, Activity, TrendingUp, Shield, AlertCircle } from "lucide-react";

export function HomePage() {
  const [realm, setRealm] = useSharedRealm();
  const { data: dashState, loading, error, refresh } = useDataRepoPoll(() => dataRepo.fetchDashboardState(realm), 60000, [realm]);
  const { data: alerts } = useDataRepoPoll(() => dataRepo.fetchDashboardAlerts(realm), 60000, [realm]);
  const connected = useSseConnected();

  useSseEvent("alert_generated", useCallback(() => { refresh(); }, [refresh]));

  if (loading && !dashState) return <LoadingState text="SYNCING_CORE..." />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const ds: RealmDashboard | undefined = realm != null ? (dashState as any)?.[String(realm)] : undefined;
  const scores = ds?.scores;
  const regime = ds?.regime;

  const sparkData = scores ? [scores.eh, scores.ms, scores.st, scores.ip, scores.sr] : [];

  const alertList = alerts
    ? (Array.isArray(alerts) ? alerts : (alerts as any).events ?? []).slice(0, 8)
    : [];

  const topMargins = (dashState as any)?.[String(realm)]?.topMargins || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-mono">
       {/* Live Ticker */}
       <div className="bg-surface-900 dark:bg-white text-white dark:text-surface-950 overflow-hidden h-6 flex items-center border border-surface-200 dark:border-surface-800">
          <div className="px-2 bg-surface-700 dark:bg-surface-200 h-full flex items-center text-[8px] font-black uppercase tracking-widest shrink-0">YIELDS_LVE</div>
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="flex items-center gap-12 whitespace-nowrap px-6"
          >
             {Array.isArray(topMargins) && topMargins.length > 0 ? topMargins.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                   <span className="text-[9px] font-bold opacity-60 uppercase">{m.n}</span>
                   <span className="text-[9px] font-black">+{m.np.toFixed(0)}/H</span>
                </div>
             )) : (
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-bold opacity-40 uppercase italic">WAITING_FOR_DATA_FEED...</span>
                </div>
             )}
          </motion.div>
       </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-surface-200 dark:border-surface-800 pb-4">
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            TERMINAL_OVERVIEW_R{realm}
          </h1>
          <p className="text-[10px] text-surface-500 mt-0.5 font-bold uppercase opacity-60">
            STRATEGIC_MONITORING_SUITE
          </p>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-bold">
           <div className="flex flex-col items-end">
              <span className={connected ? "text-green-600" : "text-surface-400"}>
                {connected ? "CONN_STABLE" : "CONN_LOST"}
              </span>
              <span className="opacity-40">INTEGRITY_100%</span>
           </div>
           <select
             value={realm}
             onChange={(e) => setRealm(Number(e.target.value))}
             className="bg-surface-100 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-[10px] font-black px-2 py-1 focus:ring-0 uppercase outline-none"
           >
             <option value={0}>R0</option>
             <option value={1}>R1</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-surface-200 dark:bg-surface-900 border border-surface-200 dark:border-surface-900">
        <HomeQuickLink to="/corporate-suite" label="FINANCIALS" icon={<Briefcase size={12}/>} sub="CASHFLOW" />
        <HomeQuickLink to="/corporate-suite" label="PRODUCTION" icon={<Factory size={12}/>} sub="SOURCING" />
        <HomeQuickLink to="/corporate-suite" label="RETAIL" icon={<ShoppingCart size={12}/>} sub="VELOCITY" />
        <HomeQuickLink to="/corporate-suite" label="CONSTRUCT" icon={<Construction size={12}/>} sub="EXPANSION" />
        <HomeQuickLink to="/corporate-suite" label="EXECUTIVE" icon={<Users size={12}/>} sub="BOARD" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Market Indicators">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-200 dark:bg-surface-900 border border-surface-200 dark:border-surface-900">
              <SmallStat title="HEALTH" value={scores?.eh ?? "-"} />
              <SmallStat title="SENTIMENT" value={scores?.ms ?? "-"} />
              <SmallStat title="STABILITY" value={scores?.st ?? "-"} />
              <SmallStat title="VOLATILITY" value={scores?.sr ?? "-"} />
            </div>
          </Section>

          <div className="border border-surface-200 dark:border-surface-900">
             <div className="px-3 py-1 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-900 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-widest">System Events</h3>
                <Link to="/alerts" className="text-[9px] font-bold hover:underline uppercase">LOG_FULL</Link>
             </div>
             <div className="divide-y divide-surface-100 dark:divide-surface-900">
               {alertList.length > 0 ? alertList.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-4 px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                    <div className="w-1.5 h-1.5 shrink-0 bg-surface-300 dark:bg-surface-700" />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold truncate uppercase">{a.ti}</span>
                      <span className="text-[9px] text-surface-400 shrink-0">{new Date(a.ts).toLocaleTimeString([], {hour12: false})}</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center text-surface-400 text-[10px] font-bold uppercase tracking-widest opacity-20 italic">IDLE_STATE</div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="border border-surface-200 dark:border-surface-900 p-6 flex flex-col items-center text-center">
            <span className="text-[9px] font-bold text-surface-400 uppercase tracking-widest mb-4">REGIME_STATE</span>
            <div className={`text-4xl font-black mb-2 tracking-tighter ${regime?.na === "Expansion" ? "text-green-600" : regime?.na === "Recession" ? "text-red-600" : "text-surface-900 dark:text-white"}`}>
              {regime?.na?.toUpperCase() ?? "NEUTRAL"}
            </div>
            <div className="text-[9px] font-bold opacity-40 mb-6 uppercase">
              CONF_LVL: {regime?.sc ?? "0"}%
            </div>
            <div className="w-full h-8 opacity-40">
              <MiniSparkline data={sparkData} color="currentColor" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeQuickLink({ to, label, icon, sub }: { to: string; label: string; icon: React.ReactNode; sub: string }) {
  return (
    <Link to={to} className="bg-white dark:bg-surface-950 p-4 hover:bg-surface-50 dark:hover:bg-surface-900 transition-all flex flex-col items-center text-center group">
       <div className="mb-2 opacity-40 group-hover:opacity-100 transition-opacity">{icon}</div>
       <span className="text-[10px] font-black uppercase tracking-widest mb-0.5">{label}</span>
       <span className="text-[8px] font-bold opacity-30 uppercase">{sub}</span>
    </Link>
  );
}

function SmallStat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-surface-950 p-4 text-center">
       <p className="text-[8px] font-bold opacity-40 uppercase mb-1">{title}</p>
       <p className="text-lg font-black">{value}</p>
    </div>
  );
}
